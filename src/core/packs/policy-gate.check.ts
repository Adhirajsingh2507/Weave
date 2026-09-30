// ponytail: the governance half of packs. A failing blocking item must stop the run and ask a
// human — Weave records and escalates, the person decides. Approving is a waiver, so the same
// gate must not reopen and trap the run in a loop.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "../api.js";
import { realise } from "../testing.js";
import { GitHarness } from "../runtime.js";
import type { ScaffoldInput, ScaffoldResult, Scaffolder } from "../scaffold.js";
import type { ExecInput, ExecResult, NodeExecutor } from "../runtime.js";

const git = (args: string[], cwd: string): string =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

const repo = mkdtempSync(join(tmpdir(), "weave-policy-"));
git(["init", "-q"], repo);
git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
git(["config", "user.email", "t@weave.local"], repo);
git(["config", "user.name", "Weave Test"], repo);
writeFileSync(join(repo, "README.md"), "# policy\n");
git(["add", "-A"], repo);
git(["commit", "-q", "-m", "init"], repo);

/** Scaffolds a page that violates a blocking a11y item: no lang attribute. */
const sloppyScaffolder: Scaffolder = {
  name: "sloppy",
  async scaffold(input: ScaffoldInput): Promise<ScaffoldResult> {
    const sections = (input.sections ?? [])
      .map((s) => `<section id="${s}" data-design-node="${s}" data-placeholder></section>`)
      .join("\n");
    writeFileSync(
      join(input.repoPath, "package.json"),
      `${JSON.stringify({ name: "sloppy", private: true, type: "module", scripts: { build: "node -e 0", check: "node -e 0" } }, null, 2)}\n`,
    );
    writeFileSync(
      join(input.repoPath, "index.html"),
      `<!doctype html>\n<html>\n<head><title>Sloppy</title>\n<meta name="viewport" content="width=device-width, initial-scale=1">\n</head>\n<body>\n<h1>Sloppy</h1>\n${sections}\n</body>\n</html>\n`,
    );
    return { files: ["package.json", "index.html"], summary: "sloppy template (no lang attribute)" };
  },
};

const agent: NodeExecutor = {
  name: "fake-agent",
  async run(input: ExecInput): Promise<ExecResult> {
    return realise(input);
  },
};

const engine = (): Engine =>
  new Engine({
    repoPath: repo,
    deps: { executor: agent, scaffolder: sloppyScaffolder, makeHarness: (p) => new GitHarness(p) },
  });

await engine().init("new");
const handle = await engine().run({ projectName: "Sloppy", text: "page: home /\ncomponent: hero section" });

// Packs default to security + a11y, so nothing needed to be asked for.
const ir = JSON.parse(readFileSync(join(repo, ".agent", "project", `ir-${handle.runId}.json`), "utf8")) as {
  meta: { packs?: string[] };
};
assert.deepEqual(ir.meta.packs, undefined, "the brief named no packs; defaults apply at run time");

await engine().resolveGate((await engine().listGates())[0]!.id, "approve");

// A blocking item failed, so the run halted at a policy gate rather than sailing to release.
const gates = await engine().listGates();
assert.equal(gates.length, 1, "exactly one open gate");
assert.equal(gates[0]!.kind, "policy", `expected a policy gate, got ${gates[0]!.kind}`);
assert.match(gates[0]!.summary, /blocking policy item/, "gate explains itself");
assert.ok(
  gates[0]!.evidenceRefs.some((e) => e.includes("a11y.lang")),
  `the gate should name the failing item, got ${JSON.stringify(gates[0]!.evidenceRefs)}`,
);

// The failure is recorded as evidence against the criterion, not just in the gate.
const report = await engine().report(handle.runId);
const langCriterion = report.requirements
  .flatMap((r) => r.criteria)
  .find((c) => c.id === "crit:a11y.lang");
assert.ok(langCriterion, "the pack item exists as a criterion");
assert.equal(langCriterion!.status, "failed", "a failing item is recorded as failed");
assert.equal(langCriterion!.severity, "blocking");

// Items that do not apply are recorded with their reason, never as passes.
const notApplicable = report.requirements
  .flatMap((r) => r.criteria)
  .filter((c) => c.status === "not-applicable");
assert.ok(notApplicable.length > 0, "payment and auth items should not fire on a static page");
assert.ok(
  notApplicable.every((c) => c.evidence.at(-1)?.detail.includes("does not apply")),
  "a not-applicable item must say why",
);

// An unplanned gate is exactly what the intervention metric should count.
assert.equal(report.metrics.unplannedGates, 1, "the policy gate counts as unplanned");
assert.ok((report.metrics.humanInterventionRate ?? 0) > 0, "intervention rate reflects it");
assert.equal(report.metrics.autonomous, false);

// Approving is a waiver: the run proceeds and the same gate does not reopen.
await engine().resolveGate(gates[0]!.id, "approve", "shipping anyway, tracked as tech debt");
const after = await engine().listGates();
assert.equal(after.length, 1, "one gate open after waiving");
assert.equal(after[0]!.kind, "pre-release", `waiving should advance to pre-release, got ${after[0]!.kind}`);

const waived = await engine().report(handle.runId);
assert.ok(
  waived.gates.some((g) => g.kind === "policy" && g.status === "approved" && g.notes?.includes("tech debt")),
  "the waiver and its reason are on the record",
);

await engine().resolveGate(after[0]!.id, "approve");
assert.equal((await engine().getRun(handle.runId))?.status, "done");

// ── Run 2: a waiver covers only the items it named, and rejecting restores the user ──
writeFileSync(join(repo, "README.md"), "# policy\nuncommitted user work\n");
const run2 = await engine().run({ projectName: "Sloppy", text: "page: home /\ncomponent: footer section" });
await engine().resolveGate((await engine().listGates())[0]!.id, "approve");
const first = (await engine().listGates())[0]!;
assert.equal(first.kind, "policy");
assert.equal(git(["stash", "list"], repo).includes("weave-autostash"), true, "user work was stashed");

// While the gate is open, a new blocking violation lands on the working branch.
const page = join(repo, "index.html");
writeFileSync(page, readFileSync(page, "utf8").replace("</body>", `<a href="/x" target="_blank">x</a>\n</body>`));
git(["commit", "-qam", "unsafe link"], repo);

await engine().resolveGate(first.id, "approve", "waive the lang attribute only");
const second = await engine().listGates();
assert.equal(second.length, 1, "the new failure opens a gate despite the earlier waiver");
assert.equal(second[0]!.kind, "policy");
assert.ok(second[0]!.evidenceRefs.some((e) => e.startsWith("sec.links.noopener")), "names the new item");
assert.ok(!second[0]!.evidenceRefs.some((e) => e.startsWith("a11y.lang")), "the waived item stays waived");

// Rejecting ends the run and puts the user back where they were.
await engine().resolveGate(second[0]!.id, "reject");
assert.equal((await engine().getRun(run2.runId))?.status, "failed");
assert.equal(git(["rev-parse", "--abbrev-ref", "HEAD"], repo), "main", "user is back on their branch");
assert.equal(git(["stash", "list"], repo), "", "auto-stash was popped, not stranded");
assert.match(readFileSync(join(repo, "README.md"), "utf8"), /uncommitted user work/, "user work restored");

rmSync(repo, { recursive: true, force: true });
console.log("policy gate check passed (blocking failure → gate → per-item waiver → release; reject restores the user)");
