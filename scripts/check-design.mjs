// Structural check for design-guide/ + demo-design/. Content is judgment; this only
// catches the mechanical failures: drifted slugs, malformed tokens, duplicate check ids,
// missing sections, stray non-Latin characters from a bad paste.
//
//   node scripts/check-design.mjs
//
// ponytail: regex over the frontmatter instead of a YAML dep — swap in a parser if the
// frontmatter ever grows nested structures this can't see.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const GUIDE_DIR = "design-guide";
const PICS_DIR = "demo-design";
const REQUIRED_HEADINGS = ["## The look in one paragraph", "## Do", "## Don't", "## How Weave verifies it"];
const REQUIRED_KEYS = ["slug:", "title:", "status:", "summary:", "tokens:", "checks:"];
const HEX = /^#[0-9A-Fa-f]{3,8}$/;
const SUSPECT_CHARS = /[Ͱ-ӿ԰-֏一-鿿]/; // Greek, Cyrillic, CJK

const manifest = JSON.parse(readFileSync(join(GUIDE_DIR, "styles.json"), "utf8"));
const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

const guides = readdirSync(GUIDE_DIR).filter((f) => f.endsWith(".md") && !f.startsWith("_") && f !== "README.md");
const slugs = new Set(manifest.styles.map((s) => s.slug));

// Every guide file must be a known slug, well-formed, and self-consistent.
for (const file of guides) {
  const slug = file.replace(/\.md$/, "");
  const src = readFileSync(join(GUIDE_DIR, file), "utf8");
  const fm = src.split("---")[1] ?? "";

  if (!slugs.has(slug)) fail(file, "not listed in styles.json");
  if (!new RegExp(`^slug:\\s*${slug}\\s*$`, "m").test(fm)) fail(file, "frontmatter slug does not match filename");
  for (const key of REQUIRED_KEYS) if (!fm.includes(key)) fail(file, `frontmatter missing ${key}`);
  if (!fm.includes("inherits: _base.md")) fail(file, "does not inherit _base.md");
  for (const h of REQUIRED_HEADINGS) if (!src.includes(h)) fail(file, `missing section "${h}"`);
  if (!src.includes(`${PICS_DIR}/${slug}/`)) fail(file, "missing reference-pictures line");

  for (const [, hex] of fm.matchAll(/value:\s*"(#[^"]*)"/g)) {
    if (!HEX.test(hex)) fail(file, `invalid hex value ${JSON.stringify(hex)}`);
  }

  const ids = [...fm.matchAll(/\{\s*id:\s*([\w.-]+)/g)].map((m) => m[1]);
  if (ids.length < 6) fail(file, `only ${ids.length} checks, expected at least 6`);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) fail(file, `duplicate check ids: ${[...new Set(dupes)].join(", ")}`);
  for (const id of ids) if (!id.includes(".")) fail(file, `check id "${id}" is not namespaced`);

  const stray = src.match(SUSPECT_CHARS);
  if (stray) fail(file, `unexpected non-Latin character ${JSON.stringify(stray[0])} — likely a corrupted paste`);

  if (!existsSync(join(PICS_DIR, slug))) fail(file, `no ${PICS_DIR}/${slug}/ folder`);
}

// Manifest status must match reality, and every style needs a picture folder.
const written = new Set(guides.map((f) => f.replace(/\.md$/, "")));
for (const s of manifest.styles) {
  const hasGuide = written.has(s.slug);
  if (s.status === "ready" && !hasGuide) fail(s.slug, "marked ready but has no guide file");
  if (hasGuide && s.status !== "ready") fail(s.slug, `guide exists but status is "${s.status}"`);
  if (!existsSync(join(PICS_DIR, s.slug))) fail(s.slug, `no ${PICS_DIR}/${s.slug}/ folder`);
}

console.log(`${manifest.styles.length} styles | ${guides.length} guides written | ${manifest.styles.length - guides.length} remaining`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("design-guide check passed");
