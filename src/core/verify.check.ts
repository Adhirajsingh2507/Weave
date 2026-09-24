// ponytail: runnable check for the deterministic verifier (real subprocesses).

import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DeterministicVerifier } from "./verify.js";

const dir = mkdtempSync(join(tmpdir(), "weave-verify-"));

// All checks pass.
const passing = new DeterministicVerifier({
  checks: [{ name: "ok", cmd: "node", args: ["-e", "process.exit(0)"] }],
  evidenceDir: dir,
});
const good = await passing.verify(dir);
assert.equal(good.ok, true);
assert.equal(good.evidence[0]!.ok, true);
assert.match(good.evidence[0]!.detail, /passed/);

// A failing check flips ok to false and captures output.
const failing = new DeterministicVerifier({
  checks: [
    { name: "ok", cmd: "node", args: ["-e", "process.exit(0)"] },
    { name: "boom", cmd: "node", args: ["-e", "console.log('nope'); process.exit(1)"] },
  ],
});
const bad = await failing.verify(dir);
assert.equal(bad.ok, false);
assert.equal(bad.evidence[1]!.ok, false);
assert.match(bad.evidence[1]!.detail, /boom failed/);

// Evidence logs were written.
assert.ok(readdirSync(dir).some((f) => f.startsWith("ok-")));

rmSync(dir, { recursive: true, force: true });
console.log("deterministic verifier check passed");
