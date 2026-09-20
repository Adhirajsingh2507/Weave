// ponytail: one runnable check for IR -> graph projection + gaps. Part of `pnpm check`.

import assert from "node:assert/strict";
import { DesignIRSchema } from "../ir/schema.js";
import { projectIR, computeGaps } from "./project.js";
import type { Edge } from "./types.js";

const ir = DesignIRSchema.parse({
  version: "1",
  meta: { projectName: "robotics-landing", createdAt: new Date().toISOString() },
  visualLanguage: { mood: "cinematic" },
  components: [
    { id: "hero", name: "Hero", kind: "section" },
    { id: "nav", name: "Nav", kind: "nav" },
  ],
  pages: [{ id: "home", name: "Home", route: "/", sections: ["hero"] }],
  assets: [{ id: "robot", type: "3d", src: "robot.glb" }],
});

const graph = projectIR(ir);

// 3 design/asset nodes: home, hero, nav, robot => 4 nodes total.
assert.equal(graph.nodes.length, 4);
assert.ok(graph.nodes.find((n) => n.id === "home" && n.kind === "design"));
assert.ok(graph.nodes.find((n) => n.id === "robot" && n.kind === "asset"));

// hero belongs_to home (section ref matched a component).
assert.equal(graph.edges.length, 1);
assert.deepEqual(
  { from: graph.edges[0]!.from, to: graph.edges[0]!.to, kind: graph.edges[0]!.kind },
  { from: "hero", to: "home", kind: "belongs_to" },
);

// Fresh project: everything is unrealized, nothing is orphan.
const gaps = computeGaps(graph);
assert.deepEqual(gaps.unrealizedDesign.sort(), ["hero", "home", "nav", "robot"]);
assert.deepEqual(gaps.orphanCode, []);

// Add a code node realizing "hero" -> hero no longer unrealized, code node not orphan.
graph.nodes.push({ id: "Hero.tsx", kind: "code", name: "Hero.tsx" });
const realizes: Edge = { from: "Hero.tsx", to: "hero", kind: "realizes", confidence: 0.94 };
graph.edges.push(realizes);
const gaps2 = computeGaps(graph);
assert.ok(!gaps2.unrealizedDesign.includes("hero"));
assert.deepEqual(gaps2.orphanCode, []);

// A stray code node with no mapping is orphan.
graph.nodes.push({ id: "util.ts", kind: "code", name: "util.ts" });
assert.deepEqual(computeGaps(graph).orphanCode, ["util.ts"]);

console.log("projection + gaps check passed");
