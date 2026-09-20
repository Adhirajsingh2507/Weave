// ponytail: runnable check for ingestion — parse (tree-sitter), sweep, mapping.

import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GraphStore } from "../store/graph-store.js";
import { DecisionRunner } from "../decision/runner.js";
import { FakeDecision } from "../decision/providers.js";
import { parseFile } from "./parse.js";
import { ingestRepo, inferMappings } from "./sweep.js";

// Unit: tree-sitter extracts imports + exports.
const facts = parseFile("a.ts", `import { b } from "./b.js";\nexport const a = 1;\n`);
assert.deepEqual(facts.imports, ["./b.js"]);
assert.ok(facts.exports.includes("a"));

// Sweep a throwaway repo → code nodes + depends_on edge + package node.
const repo = mkdtempSync(join(tmpdir(), "weave-ingest-"));
writeFileSync(join(repo, "package.json"), JSON.stringify({ name: "root-pkg" }));
writeFileSync(join(repo, "a.ts"), `import { b } from "./b.js";\nexport const a = 1;\n`);
writeFileSync(join(repo, "b.ts"), `export const b = 2;\n`);

const store = new GraphStore(":memory:");
const res = ingestRepo(store, repo);
assert.equal(res.files, 2);
assert.ok(res.packages >= 1);
assert.equal(store.getNode("a.ts")?.kind, "code");
assert.ok(store.getNode("pkg:root-pkg"));
assert.ok(store.neighbors("a.ts").some((e) => e.kind === "depends_on" && e.to === "b.ts"), "a.ts → b.ts");

// Mapping (modify-existing): infer code→design via the decision layer (fake, high confidence).
store.upsertNode({ id: "core", kind: "design", name: "Core" });
const runner = new DecisionRunner(new FakeDecision(() => ({ value: "core", confidence: 0.95 })));
const m = await inferMappings(store, runner);
assert.ok(m.mapped >= 1);
assert.ok(store.mappings({ node: "core" }).some((e) => e.kind === "realizes" && e.provenance === "inferred"));

rmSync(repo, { recursive: true, force: true });
console.log("ingestion check passed");
