// D0 — `weave doctor`: can this machine run the real demo? Answered before anything is spent.
// Every row is observed on this machine, never assumed; a row that needs a later phase says so.

import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { promisify } from "node:util";
import { ChromeBrowserWorker } from "./browser.js";
import { DECISION_MODEL } from "./decision/index.js";
import { DEFAULT_ALLOW_HOSTS, EgressProxy, describeEgress } from "./egress.js";
import { ISOLATED_CLAUDE_ARGS, scrubbedEnv, weaveMode } from "./runtime.js";
import type { WeaveMode } from "./runtime.js";
import { detectSandbox } from "./sandbox.js";
import { WEAVE_ROOT, toolBin } from "./tools.js";
import { PlaywrightBrowserWorker } from "./browser.js";

const run = promisify(execFile);

/** ok: ready. fail: blocks the demo now. later: only a later phase needs it. */
export type DoctorStatus = "ok" | "fail" | "later";

export interface DoctorRow {
  name: string;
  status: DoctorStatus;
  detail: string;
  fix?: string;
}

export interface DoctorOptions {
  claudeBin?: string;
  vercelBin?: string;
  gitleaksBin?: string;
  env?: NodeJS.ProcessEnv;
  /** Skip the one real model call (it uses the subscription). */
  offline?: boolean;
  /** Where devDependencies resolve from. Default: Weave's own install, not the target repo. */
  root?: string;
}

/** Tools the demo uses, as project devDependencies (demo plan D2). */
export const DEMO_TOOLS = ["playwright", "lighthouse", "@axe-core/playwright", "sharp", "@gltf-transform/cli"];

async function out(cmd: string, args: string[], env?: NodeJS.ProcessEnv, timeout = 30_000): Promise<string> {
  const { stdout } = await run(cmd, args, { encoding: "utf8", timeout, maxBuffer: 1 << 26, ...(env ? { env } : {}) });
  return stdout.trim();
}

export async function doctor(opts: DoctorOptions = {}): Promise<DoctorRow[]> {
  const env = opts.env ?? process.env;
  const mode: WeaveMode = weaveMode(env);
  const claude = opts.claudeBin ?? "claude";
  const rows: DoctorRow[] = [];
  const row = (name: string, status: DoctorStatus, detail: string, fix?: string): void => {
    rows.push({ name, status, detail, ...(fix ? { fix } : {}) });
  };

  // ── Claude Code and the login ────────────────────────────────
  let version = "";
  try {
    version = await out(claude, ["--version"]);
    row("claude CLI", "ok", version);
  } catch {
    row("claude CLI", "fail", "not found on PATH", "npm i -g @anthropic-ai/claude-code");
  }

  if (mode === "api") {
    row("login", env["ANTHROPIC_API_KEY"] ? "ok" : "fail", "API mode (WEAVE_MODE=api)", env["ANTHROPIC_API_KEY"] ? undefined : "set ANTHROPIC_API_KEY");
  } else if (version) {
    try {
      const auth = JSON.parse(await out(claude, ["auth", "status"])) as { loggedIn?: boolean; authMethod?: string; subscriptionType?: string };
      const sub = auth.loggedIn && auth.authMethod === "claude.ai";
      row(
        "login",
        sub ? "ok" : "fail",
        sub ? `subscription (${auth.subscriptionType ?? "plan unknown"})` : `not a subscription login (${auth.authMethod ?? "logged out"})`,
        sub ? undefined : "claude auth login",
      );
    } catch {
      row("login", "fail", "`claude auth status` gave no answer", "claude auth login");
    }
  }

  // In subscription mode no API key may reach an agent, even one sitting in the shell.
  const leaked = mode === "subscription" && scrubbedEnv([], mode)["ANTHROPIC_API_KEY"] !== undefined;
  row("agent billing", leaked ? "fail" : "ok", mode === "api" ? "API key passed to agents (API mode)" : "no API key passed to agents");

  // One real call: the model answers, through the egress proxy and the default allowlist.
  if (opts.offline) {
    row(`${DECISION_MODEL} + egress`, "later", "not checked (--offline)");
  } else if (version) {
    const proxy = new EgressProxy(DEFAULT_ALLOW_HOSTS);
    const url = await proxy.start();
    const schema = { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] };
    try {
      const raw = await out(
        claude,
        ["-p", "Reply ok: true.", "--model", DECISION_MODEL, "--output-format", "json", "--json-schema", JSON.stringify(schema),
          "--tools", "", "--no-session-persistence", ...ISOLATED_CLAUDE_ARGS],
        { ...scrubbedEnv([], mode), ...EgressProxy.env(url), CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1" },
        180_000,
      );
      const res = JSON.parse(raw) as { is_error?: boolean; structured_output?: { ok?: boolean }; modelUsage?: Record<string, unknown>; api_error_status?: number | null };
      const models = Object.keys(res.modelUsage ?? {});
      const blocked = proxy.records.filter((r) => !r.allowed);
      const good = !res.is_error && res.structured_output?.ok === true && models.includes(DECISION_MODEL) && !blocked.length;
      row(
        `${DECISION_MODEL} + egress`,
        good ? "ok" : "fail",
        `answered by ${models.join(", ") || "nothing"}; hosts: ${describeEgress(proxy.records)}`,
        good ? undefined : blocked.length ? "a needed host is off the allowlist — add it to allowHosts" : "the plan refused or rate-limited the model — try later",
      );
    } catch (e) {
      row(`${DECISION_MODEL} + egress`, "fail", (e as Error).message.split("\n")[0]!, "run the command by hand to see the error");
    } finally {
      await proxy.stop();
    }
  }

  // ── Deploy, confinement, rendering ───────────────────────────
  try {
    const who = (await out(opts.vercelBin ?? "vercel", ["whoami"], undefined, 30_000)).split("\n").pop()!;
    row("vercel CLI", "ok", `logged in as ${who}`);
  } catch {
    row("vercel CLI", "fail", "missing or logged out", "npm i -g vercel && vercel login");
  }
  const sb = detectSandbox();
  row("sandbox", sb.backend === "none" ? "fail" : "ok", sb.detail, sb.backend === "none" ? "install bubblewrap (apt install bubblewrap)" : undefined);
  const chrome = ChromeBrowserWorker.find();
  row("chrome", chrome ? "ok" : "fail", chrome ?? "no Chrome or Chromium on PATH", chrome ? undefined : "install Google Chrome");

  // ── Demo tools ───────────────────────────────────────────────
  const req = createRequire(join(opts.root ?? WEAVE_ROOT, "package.json"));
  for (const tool of DEMO_TOOLS) {
    let found = false;
    try {
      req.resolve(tool);
      found = true;
    } catch {
      /* not installed */
    }
    row(tool, found ? "ok" : "fail", found ? "installed" : "not installed", found ? undefined : "pnpm install");
  }
  const pwBrowser = PlaywrightBrowserWorker.available();
  row("playwright chromium", pwBrowser ? "ok" : "fail", pwBrowser ? "downloaded" : "not downloaded", pwBrowser ? undefined : "pnpm exec playwright install chromium");
  try {
    row("gitleaks", "ok", await out(opts.gitleaksBin ?? toolBin("gitleaks"), ["version"]));
  } catch {
    row("gitleaks", "fail", "not found", "pnpm tools:gitleaks");
  }

  // ── Later phases ─────────────────────────────────────────────
  row("jev key", env["TYPESAFE_API_KEY"] ? "ok" : "later", env["TYPESAFE_API_KEY"] ? "TYPESAFE_API_KEY set" : "TYPESAFE_API_KEY not set — needed at D8");
  return rows;
}

export function renderDoctor(rows: DoctorRow[]): string {
  const mark = { ok: "ok  ", fail: "FAIL", later: "--  " } as const;
  const lines = rows.map((r) => `${mark[r.status]} ${r.name.padEnd(28)} ${r.detail}${r.fix ? `\n     fix: ${r.fix}` : ""}`);
  const fails = rows.filter((r) => r.status === "fail").length;
  lines.push(fails ? `\n${fails} item(s) failing.` : "\nReady.");
  return lines.join("\n");
}
