// Phase 5 — deterministic verification (§113.7): run commands in the worktree,
// capture pass/fail + output as evidence. No LLM. Implements the loop's Verifier seam.

import { execFile } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import type { EvidenceRecord, Verifier, VerifyResult } from "./loop.js";

const run = promisify(execFile);

export interface Check {
  name: string;
  cmd: string;
  args: string[];
  /** Criterion this check proves, so its evidence lands on the traceability chain. */
  criterionId?: string;
}

/** Typical web-project gate checks; override per project. */
export const DEFAULT_CHECKS: Check[] = [
  { name: "build", cmd: "pnpm", args: ["-s", "build"] },
  // The scaffold's check script enforces the structural half of the _base.md floor.
  { name: "check", cmd: "pnpm", args: ["-s", "check"], criterionId: "crit:base.a11y.semantics" },
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
    const evidence: EvidenceRecord[] = [];
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
      evidence.push(this.#record(c, passed, out));
    }
    return { ok, evidence };
  }

  /** One typed record per check, with the output kept on disk when an evidence dir is set. */
  #record(check: Check, passed: boolean, out: string): EvidenceRecord {
    const record: EvidenceRecord = {
      kind: check.name === "build" ? "build" : "test",
      ok: passed,
      detail: passed
        ? `${check.name} passed`
        : `${check.name} failed: ${out.trim().split("\n").slice(-3).join(" ").slice(0, 300)}`,
      ...(check.criterionId ? { criterionId: check.criterionId } : {}),
    };
    if (!this.#evidenceDir) return record;
    mkdirSync(this.#evidenceDir, { recursive: true });
    const file = join(this.#evidenceDir, `${check.name}-${Date.now()}.log`);
    writeFileSync(file, out, "utf8");
    return { ...record, artifactPath: file };
  }
}
