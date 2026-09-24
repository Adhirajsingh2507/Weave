// ponytail: the criteria pass is independent by construction — it reads intent and the style
// guide, never the implementer's output. This check proves what it mints and that ids are
// stable, which is what makes requirements project-scoped rather than per-run.

import assert from "node:assert/strict";
import { mintCriteria, REQ_BASE, REQ_STYLE } from "./criteria.js";
import { compileBrief } from "./compiler.js";
import { loadBaseChecks, loadStyle } from "./design/style.js";

const ir = compileBrief({
  projectName: "Robotics",
  text: "style: swiss-design\npage: home /\ncomponent: hero section\nasset: robot 3d robot.glb",
});
const style = loadStyle("swiss-design");
const minted = mintCriteria(ir, style);

const requirements = minted.nodes.filter((n) => n.kind === "requirement");
const criteria = minted.nodes.filter((n) => n.kind === "criterion");

// One requirement per design element, plus the constraint/floor/style requirements.
assert.ok(
  requirements.some((r) => r.id === "req:design:hero"),
  "every design element should get a requirement",
);
assert.ok(requirements.some((r) => r.id === "req:design:robot"), "assets get requirements too");
assert.ok(requirements.some((r) => r.id === REQ_BASE), "the quality floor is a requirement");
assert.ok(requirements.some((r) => r.id === REQ_STYLE), "the chosen style is a requirement");
assert.ok(
  requirements.some((r) => r.id === "req:constraint:accessibility"),
  "IR constraints become requirements",
);

// Every criterion verifies exactly one requirement, and every requirement is verifiable.
const verifies = minted.edges.filter((e) => e.kind === "verifies");
assert.equal(verifies.length, criteria.length, "each criterion verifies a requirement");
for (const req of requirements) {
  assert.ok(
    verifies.some((e) => e.to === req.id),
    `${req.id} has no criterion verifying it`,
  );
}

// The floor and the style guide both arrive, with their sources recorded.
const base = loadBaseChecks();
assert.ok(base.length >= 14, `expected the _base.md floor to parse, got ${base.length}`);
assert.ok(base.some((c) => c.id.includes("-")), "hyphenated ids must parse");
for (const check of base) {
  assert.ok(
    criteria.some((c) => c.id === `crit:${check.id}`),
    `floor check ${check.id} was not minted`,
  );
}
for (const check of style.checks) {
  assert.ok(
    criteria.some((c) => c.id === `crit:${check.id}`),
    `style check ${check.id} was not minted`,
  );
}

// Judged criteria are marked as such, so they are never mistaken for measurements.
const judged = criteria.filter((c) => c.attrs?.["judged"] === true);
assert.ok(judged.length > 0, "judged checks should be flagged");
assert.ok(
  judged.every((c) => c.attrs?.["runner"] === "judged"),
  "a judged check cannot claim a deterministic runner",
);

// Criteria with no runner yet are honest about it rather than silently absent.
const pending = criteria.filter((c) => c.attrs?.["runner"] === "pending");
assert.ok(pending.length > 0, "criteria awaiting V2.2 runners should be minted as pending");

// Stable ids: minting twice from the same IR produces the same graph, so a second run
// updates coverage instead of duplicating requirements.
const again = mintCriteria(ir, style);
assert.deepEqual(
  again.nodes.map((n) => n.id).sort(),
  minted.nodes.map((n) => n.id).sort(),
  "criteria ids must be stable across runs",
);

// Without a style, the style requirement is absent but the floor still applies.
const unstyled = mintCriteria(compileBrief({ text: "component: hero section" }));
assert.ok(!unstyled.nodes.some((n) => n.id === REQ_STYLE), "no style means no style requirement");
assert.ok(unstyled.nodes.some((n) => n.id === REQ_BASE), "the floor applies regardless of style");

console.log(
  `criteria pass check passed (${requirements.length} requirements, ${criteria.length} criteria, ${pending.length} awaiting runners)`,
);
