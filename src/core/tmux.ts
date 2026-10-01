// D4.5 — agents in tmux windows (decisions #76–#79). Subscription mode runs each agent as an
// interactive Claude Code session in its own tmux window, in its own worktree, so the owner can
// attach, watch and type. Every prompt the session receives is captured by a hook; the ones Weave
// did not send are the owner's, and each counts as a human intervention. A repair is pasted into
// the same session as the next message. Permissions are automatic for the agent's own tools, inside
// the deny rules, the sandbox and the egress proxy — the same three layers as the headless path.
//
// How a turn ends: Claude Code's Stop hook. A turn is over once every submitted prompt has had its
// Stop, so a message the owner typed mid-turn is finished before Weave verifies.
//
// The one dialog Weave answers itself is "Do you trust this folder?" — for a worktree Weave just
// created. Nothing else is typed into a window except the task and the repairs.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { DECISION_MODEL } from "./decision/index.js";
import { DEFAULT_ALLOW_HOSTS, EgressProxy } from "./egress.js";
import { AGENT_TOOLS, ISOLATED_CLAUDE_ARGS, buildPrompt, nativeDenyRules, scrubbedEnv } from "./runtime.js";
import type { ExecInput, ExecResult, ExecutorCapabilities, NodeExecutor } from "./runtime.js";
import { detectSandbox, wrapCommand } from "./sandbox.js";



interface HookEvent {
  hook_event_name: string;
  prompt?: string;
  session_id?: string;
  transcript_path?: string;
}

interface Agent {
  window: string;
  dir: string;
  events: string;
  sent: string[];
  seen: number;
  proxy: EgressProxy;
  sessionId?: string;
  transcript?: string;
  trusted?: boolean;
}

export function tmuxAvailable(): boolean {
  try {
    execFileSync("tmux", ["-V"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Token usage summed from a Claude Code transcript (one JSON object per line). */
export function transcriptUsage(path: string): { input: number; output: number; cacheRead: number; cacheWrite: number; turns: number } {
  const total = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, turns: 0 };
  if (!existsSync(path)) return total;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line) as { type?: string; message?: { usage?: Record<string, number> } };
      const u = e.type === "assistant" ? e.message?.usage : undefined;
      if (!u) continue;
      total.turns++;
      total.input += u["input_tokens"] ?? 0;
      total.output += u["output_tokens"] ?? 0;
      total.cacheRead += u["cache_read_input_tokens"] ?? 0;
      total.cacheWrite += u["cache_creation_input_tokens"] ?? 0;
    } catch {
      // a partial line while the session writes
    }
  }
  return total;
}

export class TmuxClaudeExecutor implements NodeExecutor {
  readonly name = "claude-code-tmux";
  readonly session: string;
  #bin: string;
  #model: string;
  #turnTimeoutMs: number;
  #sandbox: "auto" | "off";
  #allowHosts: string[];
  #agents = new Map<string, Agent>();
  #root: string;

  constructor(
    opts: {
      /** tmux session holding the agent windows. Default: weave-<repo folder>. */
      session?: string;
      bin?: string;
      model?: string;
      /** How long one turn (task or repair) may run before it is a failure. Default 30 minutes. */
      turnTimeoutMs?: number;
      sandbox?: "auto" | "off";
      allowHosts?: string[];
    } = {},
  ) {
    this.session = opts.session ?? `weave-${basename(process.cwd()).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    this.#bin = opts.bin ?? "claude";
    this.#model = opts.model ?? DECISION_MODEL;
    this.#turnTimeoutMs = opts.turnTimeoutMs ?? 30 * 60_000;
    this.#sandbox = opts.sandbox ?? "auto";
    this.#allowHosts = opts.allowHosts ?? DEFAULT_ALLOW_HOSTS;
    this.#root = mkdtempSync(join(tmpdir(), "weave-agents-"));
  }

  get capabilities(): ExecutorCapabilities {
    return { canShell: true, canNetwork: true, sandboxed: this.#sandbox !== "off" && detectSandbox().backend !== "none" };
  }

  /** The command that attaches a terminal to the agent windows. */
  get attachCommand(): string {
    return `tmux attach -t ${this.session}`;
  }

  async run(input: ExecInput): Promise<ExecResult> {
    const cp = input.contextPack;
    const sandbox = this.#sandbox === "off" ? { backend: "none" as const, detail: "unsandboxed: disabled by configuration" } : detectSandbox();
    const existing = this.#agents.get(cp.taskId);
    let agent: Agent;
    let message: string;
    if (existing && existing.dir === input.worktreeDir && this.#alive(existing.window) && cp.previousFailures.length) {
      // Repair in the same session (decision #78): the reasons go in as the next message.
      agent = existing;
      message = `Verification failed. Fix this and nothing else:\n${cp.previousFailures.at(-1)}`;
      await this.#paste(agent, message);
    } else {
      if (existing) await this.finish(cp.taskId);
      message = buildPrompt(cp);
      agent = await this.#start(input, message, sandbox);
    }
    agent.sent.push(message);

    const done = await this.#waitForTurn(agent);
    const interventions = this.#interventions(agent);
    const changedFiles = execFileSync("git", ["status", "--porcelain", "-uall"], { cwd: input.worktreeDir, encoding: "utf8" })
      .split("\n")
      .filter(Boolean)
      .map((l) => l.slice(3));
    return {
      ok: done.ok,
      summary: done.ok ? `turn finished in tmux window ${this.session}:${agent.window}` : done.reason,
      changedFiles,
      evidenceRefs: [`tmux:${this.session}:${agent.window}${agent.sessionId ? ` session ${agent.sessionId}` : ""}`],
      egress: agent.proxy.records,
      sandbox,
      interventions,
      ...(agent.transcript ? { usage: transcriptUsage(agent.transcript) } : {}),
    };
  }

  /** The node is over: collect late messages, close its window and its proxy. */
  async finish(taskId: string): Promise<{ interventions: string[] }> {
    const agent = this.#agents.get(taskId);
    if (!agent) return { interventions: [] };
    const interventions = this.#interventions(agent);
    this.#agents.delete(taskId);
    try {
      execFileSync("tmux", ["kill-window", "-t", `${this.session}:${agent.window}`], { stdio: "ignore" });
    } catch {
      // already closed by the owner
    }
    await agent.proxy.stop();
    return { interventions };
  }

  async #start(input: ExecInput, prompt: string, sandbox: ReturnType<typeof detectSandbox>): Promise<Agent> {
    const cp = input.contextPack;
    const window = cp.taskId.replace(/[^a-zA-Z0-9_-]/g, "-");
    const home = join(this.#root, window);
    rmSync(home, { recursive: true, force: true });
    mkdirSync(home, { recursive: true });
    const events = join(home, "events.jsonl");
    writeFileSync(events, "");
    // Each hook appends its JSON input — which names the event — as one line.
    const hook = { type: "command", command: `sh -c 'cat >> "$0"; echo >> "$0"' ${events}` };
    const settings = {
      permissions: { deny: nativeDenyRules(cp.permissions.deny), allow: AGENT_TOOLS },
      hooks: Object.fromEntries(["SessionStart", "UserPromptSubmit", "Stop"].map((e) => [e, [{ hooks: [hook] }]])),
    };
    const settingsFile = join(home, "settings.json");
    writeFileSync(settingsFile, JSON.stringify(settings));
    writeFileSync(join(home, "prompt.txt"), prompt);

    const proxy = new EgressProxy(cp.permissions.allowHosts ?? this.#allowHosts);
    const proxyUrl = await proxy.start();
    const args = ["--model", this.#model, "--permission-mode", "acceptEdits", "--settings", settingsFile, ...ISOLATED_CLAUDE_ARGS, prompt];
    const command =
      sandbox.backend === "bwrap"
        ? wrapCommand(this.#bin, args, { worktreeDir: input.worktreeDir, repoPath: input.repoPath, deny: cp.permissions.deny })
        : { cmd: this.#bin, args };
    const env = { ...scrubbedEnv(), ...EgressProxy.env(proxyUrl), CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1" };
    // `env -i` gives the window exactly the scrubbed environment, not the tmux server's.
    const argv = ["env", "-i", ...Object.entries(env).map(([k, v]) => `${k}=${v}`), command.cmd, ...command.args];
    if (!this.#sessionExists()) {
      execFileSync("tmux", ["new-session", "-d", "-s", this.session, "-n", "weave", "-x", "220", "-y", "50"]);
    }
    execFileSync("tmux", ["new-window", "-d", "-t", `${this.session}:`, "-n", window, "-c", input.worktreeDir, ...argv]);
    const agent: Agent = { window, dir: input.worktreeDir, events, sent: [], seen: 0, proxy };
    this.#agents.set(cp.taskId, agent);
    return agent;
  }

  /**
   * Answer the trust prompt for the worktree Weave created — and only that prompt. Checked on
   * every poll until the session starts: inside bubblewrap the CLI can take well over 30s to ask.
   */
  #answerTrust(agent: Agent, started: boolean): void {
    if (started || agent.trusted) return;
    if (/trust this folder/i.test(this.#capture(agent))) {
      execFileSync("tmux", ["send-keys", "-t", `${this.session}:${agent.window}`, "Down", "Enter"]);
      agent.trusted = true;
    }
  }

  async #paste(agent: Agent, text: string): Promise<void> {
    // Bracketed paste keeps a multi-line message one message; Enter submits it.
    const file = join(this.#root, `${agent.window}.msg`);
    writeFileSync(file, text);
    execFileSync("tmux", ["load-buffer", "-b", `weave-${agent.window}`, file]);
    execFileSync("tmux", ["paste-buffer", "-p", "-d", "-b", `weave-${agent.window}`, "-t", `${this.session}:${agent.window}`]);
    await sleep(300);
    execFileSync("tmux", ["send-keys", "-t", `${this.session}:${agent.window}`, "Enter"]);
  }

  /** Done when every prompt submitted so far has had its Stop — owner messages included. */
  async #waitForTurn(agent: Agent): Promise<{ ok: true } | { ok: false; reason: string }> {
    const deadline = Date.now() + this.#turnTimeoutMs;
    const want = agent.sent.length;
    while (Date.now() < deadline) {
      const events = this.#read(agent);
      this.#answerTrust(agent, events.some((e) => e.hook_event_name === "SessionStart"));
      const start = events.find((e) => e.session_id);
      if (start) {
        agent.sessionId ??= start.session_id;
        agent.transcript ??= start.transcript_path;
      }
      const prompts = events.filter((e) => e.hook_event_name === "UserPromptSubmit").length;
      const stops = events.filter((e) => e.hook_event_name === "Stop").length;
      if (prompts >= want && stops >= prompts) return { ok: true };
      if (!this.#alive(agent.window)) return { ok: false, reason: `the agent's window closed before its turn finished (${this.session}:${agent.window})` };
      await sleep(1000);
    }
    return { ok: false, reason: `agent did not finish its turn within ${Math.round(this.#turnTimeoutMs / 60_000)} minutes` };
  }

  /** Prompts the session received that Weave did not send, not yet reported. */
  #interventions(agent: Agent): string[] {
    // tmux pastes newlines as carriage returns; compare text, not line endings.
    const norm = (t: string): string => t.replace(/\r\n?/g, "\n").trim();
    const prompts = this.#read(agent)
      .filter((e) => e.hook_event_name === "UserPromptSubmit")
      .map((e) => norm(String(e.prompt ?? "")));
    const theirs: string[] = [];
    const ours = agent.sent.map(norm);
    for (const p of prompts) {
      const i = ours.indexOf(p);
      if (i >= 0) ours.splice(i, 1);
      else theirs.push(p);
    }
    const fresh = theirs.slice(agent.seen);
    agent.seen = theirs.length;
    return fresh;
  }

  #read(agent: Agent): HookEvent[] {
    return readFileSync(agent.events, "utf8")
      .split("\n")
      .filter((l) => l.trim())
      .flatMap((l) => {
        try {
          return [JSON.parse(l) as HookEvent];
        } catch {
          return [];
        }
      });
  }

  #capture(agent: Agent): string {
    try {
      return execFileSync("tmux", ["capture-pane", "-p", "-t", `${this.session}:${agent.window}`], { encoding: "utf8" });
    } catch {
      return "";
    }
  }

  #alive(window: string): boolean {
    try {
      return execFileSync("tmux", ["list-windows", "-t", this.session, "-F", "#{window_name}"], { encoding: "utf8" }).split("\n").includes(window);
    } catch {
      return false;
    }
  }

  #sessionExists(): boolean {
    try {
      execFileSync("tmux", ["has-session", "-t", this.session], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
