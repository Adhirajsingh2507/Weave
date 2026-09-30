// ponytail: V2.6 — every token key the 91 guides use has an IR home. Each guide is compiled into
// an IR and every leaf of its tokens must come out the other side unchanged: typed where the
// schema knows the key, passed through where it does not. A guide that grows a new key cannot be
// silently dropped on the way to the agent.

import assert from "node:assert/strict";
import { compileBrief } from "./compiler.js";
import { listStyles, loadStyle, suggestStyles } from "./design/style.js";

function leaves(value: unknown, path: string[] = []): Array<[string[], unknown]> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => leaves(v, [...path, k]));
  }
  return [[path, value]];
}
const at = (obj: unknown, path: string[]): unknown =>
  path.reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);

const slugs = listStyles();
assert.equal(slugs.length, 91, "all 91 guides");
let checked = 0;
for (const slug of slugs) {
  const guide = loadStyle(slug);
  const ir = compileBrief({ text: `style: ${slug}\ncomponent: hero section` });
  assert.ok(ir.designTokens, `${slug}: no tokens in the IR`);
  for (const [path, value] of leaves(guide.tokens)) {
    assert.deepEqual(at(ir.designTokens, path), value, `${slug}: token ${path.join(".")} did not survive into the IR`);
    checked++;
  }
  // The typed core is present for every guide — what the scaffold and the agent can rely on.
  const t = ir.designTokens!;
  assert.equal(typeof t.shape.radius_px, "number", `${slug}: shape.radius_px`);
  assert.equal(typeof t.motion.duration_ms, "number", `${slug}: motion.duration_ms`);
  assert.ok(t.layout.section_spacing_px.length > 0, `${slug}: layout.section_spacing_px`);
}

// Style suggestion: deterministic, explained, and never recommending what a guide rules out.
const robotics = suggestStyles("A landing page for a robotics hardware company launching a humanoid robot");
assert.equal(robotics[0]?.slug, "futuristic", `robotics should suggest futuristic first, got ${robotics.map((s) => s.slug).join(", ")}`);
assert.ok(robotics[0]!.reasons.some((r) => /robotics/.test(r)), "and say why");
const bakery = suggestStyles("A family bakery with handmade bread and a warm neighbourhood feel");
assert.ok(!bakery.some((s) => s.slug === "futuristic"), "futuristic avoids family brands and handmade");
for (const s of bakery) assert.ok(s.score > 0 && s.reasons.length > 0);
assert.deepEqual(suggestStyles("zzzz qqqq"), [], "a brief that matches nothing gets nothing, not a guess");

console.log(`IR tokens check passed (91 guides, ${checked} token leaves carried into the IR; suggestions explained)`);
