// Phase 5 — deterministic verification (§113.7): run commands in the worktree,
// capture pass/fail + output as evidence. No LLM. Implements the loop's Verifier seam.

import { execFile } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import type { Verifier, VerifyResult } from "./loop.js";

const run = promisify(execFile);

export interface Check {
  name: string;
  cmd: string;
  args: string[];
}

/** Typical web-project gate checks; override per project. */
export const DEFAULT_CHECKS: Check[] = [
  { name: "build", cmd: "pnpm", args: ["-s", "build"] },
  { name: "test", cmd: "pnpm", args: ["-s", "check"] },
];

export interface DeterministicVerifierOptions {
  checks?: Check[];
  /** Directory to write per-check output logs into (e.g. .agent/evidence). */
  evidenceDir?: string;
  /** Per-check ceiling; a hung build must not hang the run. */
  timeoutMs?: number;
}

export class DeterministicVerifier implements Verifier {
  #checks: Check[];
  #evidenceDir: string | undefined;
  #timeoutMs: number;

  constructor(opts: DeterministicVerifierOptions = {}) {
    this.#checks = opts.checks ?? DEFAULT_CHECKS;
    this.#evidenceDir = opts.evidenceDir;
    this.#timeoutMs = opts.timeoutMs ?? 5 * 60_000;
  }

  async verify(worktreeDir: string): Promise<VerifyResult> {
    const evidence: string[] = [];
    let ok = true;
    for (const c of this.#checks) {
      let passed = true;
      let out = "";
      try {
        // Async so concurrent node verification actually overlaps.
        const res = await run(c.cmd, c.args, {
          cwd: worktreeDir,
          encoding: "utf8",
          maxBuffer: 64 * 1024 * 1024,
          timeout: this.#timeoutMs,
        });
        out = res.stdout;
      } catch (e) {
        passed = false;
        const err = e as { stdout?: Buffer | string; message?: string; killed?: boolean };
        out = err.killed
          ? `check '${c.name}' timed out after ${this.#timeoutMs}ms`
          : (err.stdout?.toString() ?? err.message ?? String(e));
      }
      ok = ok && passed;
      evidence.push(this.#writeEvidence(c.name, passed, out));
    }
    return { ok, evidence };
  }

  #writeEvidence(name: string, passed: boolean, out: string): string {
    const label = `check:${name}=${passed ? "pass" : "fail"}`;
    if (!this.#evidenceDir) return label;
    mkdirSync(this.#evidenceDir, { recursive: true });
    const file = join(this.#evidenceDir, `${name}-${Date.now()}.log`);
    writeFileSync(file, out, "utf8");
    return `${label} (${file})`;
  }
}
