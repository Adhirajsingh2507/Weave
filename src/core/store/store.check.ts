// ponytail: one runnable check for the SQLite graph store. Part of `pnpm check`.

import assert from "node:assert/strict";
import { DesignIRSchema } from "../ir/schema.js";
import { projectIR } from "../graph/project.js";
import { GraphStore } from "./graph-store.js";

const ir = DesignIRSchema.parse({
  version: "1",
  meta: { projectName: "s", createdAt: new Date().toISOString() },
  visualLanguage: { mood: "cinematic" },
  components: [{ id: "hero", name: "Hero", kind: "section" }],
  pages: [{ id: "home", name: "Home", route: "/", sections: ["hero"] }],
});

const store = new GraphStore(":memory:");
store.loadGraph(projectIR(ir));

assert.equal(store.getNode("hero")?.name, "Hero");
assert.equal(store.getNode("home")?.attrs?.["route"], "/");
assert.equal(store.allNodes().length, 2);
assert.equal(store.neighbors("home").length, 1);

// Fresh project: both design nodes unrealized.
assert.deepEqual(store.gaps().unrealizedDesign.sort(), ["hero", "home"]);

// Re-load is idempotent (INSERT OR REPLACE, stable IDs).
store.loadGraph(projectIR(ir));
assert.equal(store.allNodes().length, 2);

// Realizing "hero" with a code node removes it from gaps.
store.upsertNode({ id: "Hero.tsx", kind: "code", name: "Hero.tsx" });
store.upsertEdge({ from: "Hero.tsx", to: "hero", kind: "realizes", confidence: 0.94, provenance: "inferred" });
assert.ok(!store.gaps().unrealizedDesign.includes("hero"));

// query
assert.equal(store.query({ kind: "design" }).length, 2); // home, hero
assert.equal(store.query({ nameContains: "Home" }).length, 1); // page "Home" only
assert.equal(store.query({ nameContains: "Hero" }).length, 2); // "Hero" component + "Hero.tsx" code

// mappings (+ filters)
assert.equal(store.mappings().length, 1);
assert.equal(store.mappings({ minConfidence: 0.95 }).length, 0);
assert.equal(store.mappings({ node: "hero" }).length, 1);
assert.equal(store.mappings({ provenance: "inferred" }).length, 1);

// run state + execution graph
store.createRun({ runId: "r1", status: "running", startedAt: new Date().toISOString(), budgetUsed: 0 });
store.upsertExecNode("r1", { id: "impl:hero", kind: "impl", designNodeId: "hero", status: "pending" });
assert.equal(store.getRun("r1")?.status, "running");
assert.equal(store.getExecGraph("r1").length, 1);

store.upsertExecNode("r1", { id: "impl:hero", kind: "impl", designNodeId: "hero", status: "complete", commit: "abc123" });
assert.equal(store.getExecNode("r1", "impl:hero")?.status, "complete");
assert.equal(store.getExecNode("r1", "impl:hero")?.commit, "abc123");

store.updateRun("r1", { status: "gated", cursor: "impl:hero", budgetUsed: 5 });
assert.equal(store.getRun("r1")?.status, "gated");
assert.equal(store.getRun("r1")?.cursor, "impl:hero");
assert.equal(store.getRun("r1")?.budgetUsed, 5);
assert.equal(store.latestRun()?.runId, "r1");

store.close();
console.log("graph store check passed");
