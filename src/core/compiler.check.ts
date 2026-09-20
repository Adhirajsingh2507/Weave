// ponytail: runnable check for the Design Compiler intake (brief → IR) + projection.

import assert from "node:assert/strict";
import { compileBrief } from "./compiler.js";
import { projectIR } from "./graph/project.js";

// Line-directive brief → IR.
const ir = compileBrief({
  projectName: "x",
  text: "# comment\npage: home / hero\ncomponent: hero section\nasset: robot 3d robot.glb",
});
assert.equal(ir.meta.projectName, "x");
assert.equal(ir.pages.length, 1);
assert.equal(ir.pages[0]!.id, "home");
assert.deepEqual(ir.pages[0]!.sections, ["hero"]);
assert.equal(ir.components[0]!.name, "Hero");
assert.equal(ir.assets[0]!.type, "3d");

// Projection: home + hero + robot = 3 design/asset nodes; hero belongs_to home.
const g = projectIR(ir);
assert.equal(g.nodes.length, 3);
assert.equal(g.edges.length, 1);
assert.equal(g.edges[0]!.kind, "belongs_to");

// Partial-IR passthrough (defaults applied by Zod).
const ir2 = compileBrief({
  ir: {
    version: "1",
    meta: { projectName: "y", createdAt: new Date().toISOString() },
    visualLanguage: { mood: "m" },
    components: [{ id: "nav", name: "Nav", kind: "nav" }],
  },
});
assert.equal(ir2.components[0]!.id, "nav");
assert.equal(ir2.typography.scale, "default");

// Empty brief → valid, empty IR.
assert.equal(compileBrief({}).pages.length, 0);

// Invalid asset type is rejected (type-safety).
assert.throws(() => compileBrief({ text: "asset: x banana y" }));

console.log("compiler check passed");
