// ponytail: one runnable check that fails if the IR contract breaks. `pnpm check`.

import assert from "node:assert/strict";
import { DesignIRSchema } from "./schema.js";

const sample = {
  version: "1",
  meta: { projectName: "demo", createdAt: new Date().toISOString() },
  visualLanguage: { mood: "cinematic" },
  components: [{ id: "hero", name: "Hero", kind: "section" }],
  pages: [{ id: "home", name: "Home", route: "/" }],
};

const parsed = DesignIRSchema.parse(sample);
assert.equal(parsed.components[0]!.id, "hero");
assert.equal(parsed.typography.scale, "default"); // default applied
assert.equal(parsed.constraints.accessibility, "AA");
assert.equal(parsed.pages[0]!.route, "/");

// Invalid enum value must be rejected.
assert.throws(() =>
  DesignIRSchema.parse({ ...sample, assets: [{ id: "x", type: "hologram", src: "a.glb" }] }),
);

console.log("IR schema check passed");
