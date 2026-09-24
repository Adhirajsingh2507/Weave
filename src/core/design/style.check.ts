// ponytail: the 91 guides are the parser's test corpus. If the YAML subset parser drifts,
// this fails loudly rather than silently handing an agent half a style.

import assert from "node:assert/strict";
import { listStyles, loadStyle, styleBrief, styleTokensCss } from "./style.js";

const slugs = listStyles();
assert.ok(slugs.length >= 90, `expected 90+ guides, found ${slugs.length}`);

let checkCount = 0;
for (const slug of slugs) {
  const style = loadStyle(slug);
  assert.equal(style.slug, slug, `${slug}: frontmatter slug mismatch`);
  assert.ok(style.title.length > 0, `${slug}: no title`);
  assert.ok(style.summary.length > 10, `${slug}: no usable summary`);
  assert.ok(Object.keys(style.tokens).length >= 3, `${slug}: tokens look unparsed`);
  assert.ok(style.checks.length >= 6, `${slug}: only ${style.checks.length} checks parsed`);
  for (const c of style.checks) {
    assert.ok(c.id && c.id.includes("."), `${slug}: check id not namespaced: ${JSON.stringify(c)}`);
    assert.ok(c.rule && c.rule.length > 10, `${slug}: check ${c.id} has no rule text`);
    assert.ok(["deterministic", "judged"].includes(c.kind), `${slug}: check ${c.id} kind ${c.kind}`);
  }
  assert.ok(style.dos.length >= 3, `${slug}: Do list not parsed`);
  assert.ok(style.donts.length >= 3, `${slug}: Don't list not parsed`);
  checkCount += style.checks.length;
}

// Nested structures must survive, not just top-level keys.
const swiss = loadStyle("swiss-design");
const colors = swiss.tokens["colors"] as { palette: Array<{ name: string; value: string }> };
assert.ok(Array.isArray(colors.palette), "swiss palette should be a list");
assert.equal(colors.palette.find((c) => c.name === "accent")?.value, "#E3000F");
const shape = swiss.tokens["shape"] as { radius_px: number };
assert.equal(shape.radius_px, 0, "numbers should parse as numbers");

// Values containing commas and colons inside quotes must stay intact.
const mcm = loadStyle("mid-century-modern");
const motion = mcm.tokens["motion"] as { easing: string };
assert.match(motion.easing, /^cubic-bezier\(0\.33, 0, 0\.2, 1\)$/, "quoted easing lost its commas");

// Variants and per-variant check filters.
const min = loadStyle("minimalism");
assert.ok(min.variants && min.variants.length === 4, "minimalism should expose 4 variants");
assert.ok(
  min.checks.some((c) => Array.isArray(c.applies_to) && c.applies_to.includes("true-dark")),
  "variant-scoped checks should carry applies_to",
);

// Consumers produce something usable.
const css = styleTokensCss(swiss);
assert.match(css, /--colors-palette-accent: #E3000F;/, "tokens should flatten into CSS variables");
const brief = styleBrief(swiss);
assert.match(brief, /Swiss Design/);
assert.match(brief, /swiss\.shape\.radius-zero/, "brief should tell the agent what it is judged on");

console.log(`style guides check passed (${slugs.length} guides, ${checkCount} checks parsed)`);
