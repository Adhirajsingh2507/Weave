// Deployment as a gated RELEASE step (decision #5b: opt-in via a Deployer). The pre-release gate
// is the human approval before deploy.
//
// V2.4: a deploy secret lives only in the release step's own child process. Agents run with a
// scrubbed environment (runtime.ts), so a token in the engine's environment never reaches them,
// and a token handed to a deployer here is never put on a command line, where other users on
// the machine could read it.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { scrubbedEnv } from "./runtime.js";

const run = promisify(execFile);

export interface DeployResult {
  ok: boolean;
  url?: string;
  log: string;
}

export interface DeployContext {
  /** The commit being released, for the deploy record. */
  commit?: string;
}

export interface Deployer {
  deploy(repoPath: string, ctx?: DeployContext): Promise<DeployResult>;
}

async function exec(
  cmd: string,
  args: string[],
  opts: { cwd: string; env: NodeJS.ProcessEnv; timeoutMs: number },
): Promise<{ ok: boolean; out: string }> {
  try {
    const { stdout, stderr } = await run(cmd, args, {
      cwd: opts.cwd,
      env: opts.env,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      timeout: opts.timeoutMs,
    });
    return { ok: true, out: `${stdout}${stderr ? `\n${stderr}` : ""}` };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return { ok: false, out: `${err.stdout ?? ""}${err.stderr ?? ""}` || (err.message ?? String(e)) };
  }
}

/** Runs a configured deploy command (e.g. `vercel --prod`) in the repo; scrapes a URL. */
export class CommandDeployer implements Deployer {
  #cmd: string;
  #args: string[];
  #env: NodeJS.ProcessEnv;
  #timeoutMs: number;

  constructor(cmd: string, args: string[] = [], opts: { env?: NodeJS.ProcessEnv; timeoutMs?: number } = {}) {
    this.#cmd = cmd;
    this.#args = args;
    this.#env = opts.env ?? process.env;
    this.#timeoutMs = opts.timeoutMs ?? 15 * 60_000;
  }

  async deploy(repoPath: string): Promise<DeployResult> {
    const res = await exec(this.#cmd, this.#args, { cwd: repoPath, env: this.#env, timeoutMs: this.#timeoutMs });
    const url = /https?:\/\/\S+/.exec(res.out)?.[0];
    return { ok: res.ok, ...(res.ok && url ? { url } : {}), log: res.out };
  }
}

/**
 * Vercel (decision: the demo's deploy target). Builds the project, then uploads the built
 * output as a static deployment. The token comes from the constructor or VERCEL_TOKEN and is
 * handed to the vercel CLI through its environment only; without one, the CLI's own login is
 * used.
 */
export class VercelDeployer implements Deployer {
  #token: string | undefined;
  #prod: boolean;
  #outputDir: string;
  #build: boolean;
  #bin: string;
  #timeoutMs: number;

  constructor(
    opts: { token?: string; prod?: boolean; outputDir?: string; build?: boolean; bin?: string; timeoutMs?: number } = {},
  ) {
    this.#token = opts.token ?? process.env["VERCEL_TOKEN"];
    this.#prod = opts.prod ?? false;
    this.#outputDir = opts.outputDir ?? "dist";
    this.#build = opts.build ?? true;
    this.#bin = opts.bin ?? "vercel";
    this.#timeoutMs = opts.timeoutMs ?? 15 * 60_000;
  }

  async deploy(repoPath: string): Promise<DeployResult> {
    const log: string[] = [];
    if (this.#build) {
      const build = await exec("pnpm", ["-s", "build"], { cwd: repoPath, env: scrubbedEnv(), timeoutMs: this.#timeoutMs });
      log.push(build.out);
      if (!build.ok) return { ok: false, log: `build failed before deploy:\n${log.join("\n")}` };
    }
    const env = {
      ...scrubbedEnv(["VERCEL_ORG_ID", "VERCEL_PROJECT_ID"]),
      ...(this.#token ? { VERCEL_TOKEN: this.#token } : {}),
    };
    const args = ["deploy", this.#outputDir, "--yes", ...(this.#prod ? ["--prod"] : [])];
    const res = await exec(this.#bin, args, { cwd: repoPath, env, timeoutMs: this.#timeoutMs });
    log.push(res.out);
    // The CLI prints the deployment URL on stdout; the last vercel.app URL is the deployment.
    const urls = res.out.match(/https:\/\/[^\s"']+\.vercel\.app\b/g) ?? [];
    const url = urls.at(-1);
    return { ok: res.ok && Boolean(url), ...(url ? { url } : {}), log: log.join("\n") };
  }
}

/** Deterministic fake for tests/offline. */
export class FakeDeployer implements Deployer {
  #url: string;
  constructor(url = "https://weave.example/preview") {
    this.#url = url;
  }
  async deploy(): Promise<DeployResult> {
    return { ok: true, url: this.#url, log: "fake deploy" };
  }
}
