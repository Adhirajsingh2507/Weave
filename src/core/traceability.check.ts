// ponytail: the V2.1 exit criterion, end to end on a real repo with the real scaffolder and
// real verifier. Proves the chain requirement → design → code → criterion → evidence → commit
// → approval, and that the five metrics compute from persisted state rather than from logs.
//
// The run is shaped deliberately: one node fails twice before passing, so first-pass and repair
// rates have something to measure and are not vacuously 100%.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "./api.js";
import { realise } from "./testing.js";
import { GitHarness } from "./runtime.js";
import { renderReport } from "./report.js";
import { MANDATORY_GATES } from "./metrics.js";
import type { ExecInput, ExecResult, NodeExecutor } from "./runtime.js";

const git = (args: string[], cwd: string): string =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

const repo = mkdtempSync(join(tmpdir(), "weave-trace-"));
git(["init", "-q"], repo);
git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
git(["config", "user.email", "t@weave.local"], repo);
git(["config", "user.name", "Weave Test"], repo);
writeFileSync(join(repo, "README.md"), "# trace\n");
git(["add", "-A"], repo);
git(["commit", "-q", "-m", "init"], repo);

// "hero" writes nothing on its first two attempts, so the build check fails and the loop
// repairs — giving the metrics a real failure to measure.
const attemptsSeen = new Map<string, number>();
const agent: NodeExecutor = {
  name: "fake-agent",
  async run(input: ExecInput): Promise<ExecResult> {
    const id = input.contextPack.taskId.replace("impl:", "");
    const n = (attemptsSeen.get(id) ?? 0) + 1;
    attemptsSeen.set(id, n);
    if (id === "hero" && n <= 2) {
      return { ok: true, summary: "no change yet", changedFiles: [], evidenceRefs: [`try:${id}`] };
    }
    return realise(input);
  },
};

const engine = (): Engine =>
  new Engine({ repoPath: repo, deps: { executor: agent, makeHarness: (p) => new GitHarness(p) } });

await engine().init("new");
const handle = await engine().run({
  projectName: "Robotics",
  text: "style: swiss-design\npage: home /\ncomponent: hero section\ncomponent: features section",
});

// Criteria are minted before implementation — the independence that decision #25 requires.
const criteriaAtGate = await engine().query({ kind: "criterion" });
assert.ok(criteriaAtGate.length > 20, "criteria must exist before any node runs");
const requirementsAtGate = await engine().query({ kind: "requirement" });
assert.ok(requirementsAtGate.length >= 6, "requirements minted at intake");

const designGate = (await engine().listGates()).find((g) => g.runId === handle.runId)!;
await engine().resolveGate(designGate.id, "approve", "keep the hero copy tight");

const report = await engine().report(handle.runId);

// ── The chain ─────────────────────────────────────────────
const heroReq = report.requirements.find((r) => r.id === "req:design:hero");
assert.ok(heroReq, "hero requirement present");
assert.equal(heroReq!.designNodeId, "hero", "requirement covers its design node");
assert.ok(heroReq!.codeFiles.includes("sections/hero.html"), "requirement resolves to real code");
assert.ok(heroReq!.commits.length > 0, "requirement resolves to a commit");
assert.ok(heroReq!.criteria.length > 0, "requirement has criteria");
assert.ok(
  heroReq!.criteria.some((c) => c.status === "passed"),
  "hero should have passing evidence",
);

// Structural requirements are covered; nothing is orphaned without explanation.
const designReqs = report.requirements.filter((r) => r.source === "ir");
assert.ok(designReqs.length >= 3, "page + components produce requirements");
for (const req of designReqs) {
  assert.ok(req.covered, `${req.id} has no evidence at all`);
}

// Pending criteria are visible rather than silently passing.
const pending = report.requirements.flatMap((r) => r.criteria).filter((c) => c.status === "pending");
assert.ok(pending.length > 0, "criteria awaiting V2.2 runners should show as pending");
assert.ok(
  pending.every((c) => c.evidence.length === 0),
  "a pending criterion must not carry evidence",
);

// Evidence is typed and traceable, not a string blob.
const withEvidence = report.requirements.flatMap((r) => r.criteria).filter((c) => c.evidence.length);
assert.ok(withEvidence.length > 0, "some criteria carry evidence");
for (const c of withEvidence) {
  for (const e of c.evidence) {
    assert.ok(typeof e.ok === "boolean" && e.kind && e.detail, `malformed evidence on ${c.id}`);
  }
}

// ── The metrics ───────────────────────────────────────────
const m = report.metrics;
assert.equal(m.implNodes, 3, "page + two components");
// hero took 3 attempts; the other two passed first time.
assert.equal(m.firstPassVerificationRate, 0.6667, `first-pass rate was ${m.firstPassVerificationRate}`);
assert.equal(m.repairSuccessRate, 1, "the node that failed did recover");
assert.equal(m.humanInterventionRate, 0, "only mandatory gates were opened");
assert.equal(m.unplannedGates, 0, "no unplanned gates");
assert.ok(m.evidenceCoverage !== null && m.evidenceCoverage > 0, "coverage computed");
assert.ok(m.pendingCriteria > 0, "pending criteria reported honestly");

// Mandatory gates are excluded from intervention by definition, not by accident.
assert.ok(report.gates.every((g) => MANDATORY_GATES.includes(g.kind as never)), "only mandatory gates so far");
assert.ok(
  report.gates.some((g) => g.notes === "keep the hero copy tight"),
  "gate notes survive into the report",
);

// The run is not autonomous yet: pre-release is still open.
assert.equal(m.autonomous, false, "not done until release is approved");
const releaseGate = (await engine().listGates()).find((g) => g.runId === handle.runId)!;
await engine().resolveGate(releaseGate.id, "approve");
const finished = await engine().metrics(handle.runId);
assert.equal(finished.autonomous, true, "no unplanned gates and done → autonomous");

const project = await engine().projectMetrics();
assert.equal(project.autonomousCompletionRate, 1, "one finished run, fully autonomous");

// The rendering a human actually reads.
const text = renderReport(await engine().report(handle.runId));
assert.match(text, /first-pass verification\s+67%/, "metrics rendered");
assert.match(text, /req:design:hero/, "requirements rendered");
assert.match(text, /awaiting a runner/, "pending criteria surfaced to the reader");

rmSync(repo, { recursive: true, force: true });
console.log(
  `traceability check passed (${report.requirements.length} requirements, coverage ${Math.round((m.evidenceCoverage ?? 0) * 100)}%, ${m.pendingCriteria} awaiting runners)`,
);
