// ponytail: one runnable check for the decision runner — escalation routing + corpus.
// Uses FakeDecision (no network). Part of `pnpm check`.

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FakeDecision } from "./providers.js";
import { DecisionRunner } from "./runner.js";

const dir = mkdtempSync(join(tmpdir(), "weave-dec-"));
const corpus = join(dir, "decisions.jsonl");

// Confidence drives the escalation path (default thresholds 0.85 / 0.6).
const high = new DecisionRunner(new FakeDecision(() => ({ value: "pass", confidence: 0.95 })), { corpusPath: corpus });
const mid = new DecisionRunner(new FakeDecision(() => ({ value: "pass", confidence: 0.7 })));
const low = new DecisionRunner(new FakeDecision(() => ({ value: "pass", confidence: 0.3 })));

const h = await high.run({ name: "qa.scoreEvidence", state: { x: 1 } });
assert.equal(h.escalation, "accept");
assert.equal(h.result.value, "pass");

assert.equal((await mid.run({ name: "qa.scoreEvidence", state: {} })).escalation, "llm");
assert.equal((await low.run({ name: "qa.scoreEvidence", state: {} })).escalation, "human");

// Stricter high (0.9) for mapping: 0.88 escalates to llm here.
const map = new DecisionRunner(new FakeDecision(() => ({ value: "hero", confidence: 0.88 })));
assert.equal((await map.run({ name: "map.classifyFileToDesign", state: {} })).escalation, "llm");

// Corpus recorded the high-confidence decision (one line, with state).
const lines = readFileSync(corpus, "utf8").trim().split("\n");
assert.equal(lines.length, 1);
const rec = JSON.parse(lines[0]!);
assert.equal(rec.name, "qa.scoreEvidence");
assert.equal(rec.escalation, "accept");
assert.equal(rec.confidence, 0.95);
assert.deepEqual(rec.state, { x: 1 });

rmSync(dir, { recursive: true, force: true });
console.log("decision runner check passed");
