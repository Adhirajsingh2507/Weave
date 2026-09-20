// Post-V1 — deployment as a gated RELEASE step (decision #5b: out of v1 by default,
// opt-in via a Deployer). The pre-release gate is the human approval before deploy.

import { execFileSync } from "node:child_process";

export interface DeployResult {
  ok: boolean;
  url?: string;
  log: string;
}

export interface Deployer {
  deploy(repoPath: string): Promise<DeployResult>;
}

/** Runs a configured deploy command (e.g. `vercel --prod`) in the repo; scrapes a URL. */
export class CommandDeployer implements Deployer {
  #cmd: string;
  #args: string[];
  constructor(cmd: string, args: string[] = []) {
    this.#cmd = cmd;
    this.#args = args;
  }
  async deploy(repoPath: string): Promise<DeployResult> {
    try {
      const log = execFileSync(this.#cmd, this.#args, {
        cwd: repoPath,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      });
      const url = /https?:\/\/\S+/.exec(log)?.[0];
      return { ok: true, url, log };
    } catch (e) {
      const err = e as { stdout?: Buffer | string; message?: string };
      return { ok: false, log: err.stdout?.toString() ?? err.message ?? String(e) };
    }
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
