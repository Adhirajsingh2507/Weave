// D8 — Jev behind the Decision seam, against a stand-in of its HTTP API (no key on this machine
// yet). Proven: the request matches the documented contract (POST /v1/systemone, Bearer key,
// pinned model, one Choice question with criteria); the answer maps to value + Jev's confidence;
// 429 is retried and a persistent 429 is ModelUnavailableError; oversize state is trimmed to fit;
// parity judges each decision type against the policy's tolerances; only passing types route to Jev.

import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FakeDecision } from "./providers.js";
import { ModelUnavailableError } from "./index.js";
import { JEV_MODEL, JevDecision, RoutedDecision, ece, fitState, policyFromParity, readCorpus, runParity } from "./jev.js";

const calls: Array<{ url: string; auth: string; body: { state: unknown; model: string; questions: Record<string, { type: string; instructions: string; criteria: Record<string, string | null> }> } }> = [];
let mode: "ok" | "busy-once" | "busy" = "ok";
let busyLeft = 0;
const standIn = (async (url: string, init: { headers: Record<string, string>; body: string }) => {
  const body = JSON.parse(init.body);
  calls.push({ url, auth: init.headers["authorization"]!, body });
  if (mode === "busy" || (mode === "busy-once" && busyLeft-- > 0)) return new Response("overloaded", { status: 429, headers: { "retry-after": "0" } });
  const q = body.questions.decision;
  const options = Object.keys(q.criteria);
  // Agree with the incumbent when the state says so; otherwise pick the other option.
  const pick = body.state?.agree === false ? options[1] : options[0];
  return Response.json({
    model: JEV_MODEL,
    answers: { decision: { type: "choice", choice: pick, probabilities: Object.fromEntries(options.map((o: string) => [o, o === pick ? 0.9 : 0.1 / (options.length - 1)])), confidence: body.state?.agree === false ? 0.3 : 0.98 } },
    usage: { input_tokens: 300, output_tokens: 20 },
  });
}) as unknown as typeof fetch;

const jev = new JevDecision({ apiKey: "ts-test", fetch: standIn, retries: 2 });

// ── The contract ──
const r = await jev.decide<unknown, string>({ name: "risk.classifyOperation", state: { diff: "+<h2>Go2</h2>", changes: ["sections/hero.html"] }, candidates: ["safe", "risky"] });
assert.deepEqual([r.value, r.confidence, r.provider, r.model], ["safe", 0.98, "jev", JEV_MODEL]);
const c = calls.at(-1)!;
assert.equal(c.url, "https://api.typesafe.ai/v1/systemone");
assert.equal(c.auth, "Bearer ts-test");
assert.equal(c.body.model, "jev-1.13.0", "the model is pinned, not jev-latest");
assert.equal(c.body.questions.decision!.type, "choice");
assert.match(c.body.questions.decision!.instructions, /safe to merge without a human/);
assert.match(String(c.body.questions.decision!.criteria["risky"]), /dependency/, "each option says what it means");
await assert.rejects(jev.decide({ name: "route.branch", state: {} }), /typed questions only/, "Jev does not generate");
await assert.rejects(new JevDecision({ apiKey: "", fetch: standIn }).ask({}, {}), /TYPESAFE_API_KEY/);

// ── Rate limits ──
mode = "busy-once";
busyLeft = 1;
assert.equal((await jev.decide<unknown, string>({ name: "qa.scoreEvidence", state: {}, candidates: ["pass", "fail", "partial"] })).value, "pass", "a 429 is retried");
mode = "busy";
await assert.rejects(jev.decide({ name: "qa.scoreEvidence", state: {}, candidates: ["pass", "fail"] }), ModelUnavailableError, "a persistent 429 stops and asks");
mode = "ok";

// ── State that would overflow the window is trimmed, longest field first ──
const big = fitState({ diff: "x".repeat(200_000), node: "impl:hero" }) as { diff: string; node: string };
assert.ok(JSON.stringify(big).length <= 90_000 && big.node === "impl:hero" && /trimmed/.test(big.diff));

// ── Parity ──
assert.equal(ece([{ confidence: 0.9, correct: true }, { confidence: 0.9, correct: true }]), 0.09999999999999998);
const dir = mkdtempSync(join(tmpdir(), "weave-jev-"));
const corpus = join(dir, "decisions.jsonl");
const lines: string[] = [];
// risk: Jev agrees on all 25 → switch; qa: Jev disagrees on 10 of 25 → stay; map: 3 entries → too few.
for (let i = 0; i < 25; i++) lines.push(JSON.stringify({ name: "risk.classifyOperation", value: "safe", confidence: 0.9, provider: "claude-code", state: { i }, candidates: ["safe", "risky"] }));
for (let i = 0; i < 25; i++) lines.push(JSON.stringify({ name: "qa.scoreEvidence", value: "pass", confidence: 0.9, provider: "claude-code", state: { i, agree: i >= 10 }, candidates: ["pass", "fail"] }));
for (let i = 0; i < 3; i++) lines.push(JSON.stringify({ name: "map.classifyFileToDesign", value: "a", confidence: 0.9, provider: "claude-code", state: { i }, candidates: ["a", "b"] }));
lines.push(JSON.stringify({ name: "risk.classifyOperation", value: "safe", confidence: 0.9, provider: "jev", state: {}, candidates: ["safe", "risky"] }));
writeFileSync(corpus, `${lines.join("\n")}\n`);
const entries = readCorpus(corpus);
assert.equal(entries.length, 53, "Jev's own answers are not replayed against themselves");
const rows = await runParity(entries, jev);
const row = (n: string) => rows.find((x) => x.name === n)!;
assert.equal(row("risk.classifyOperation").verdict, "switch", row("risk.classifyOperation").why);
assert.equal(row("qa.scoreEvidence").verdict, "stay");
assert.equal(row("qa.scoreEvidence").agreement, 0.6);
assert.equal(row("map.classifyFileToDesign").verdict, "too few");

// ── Routing: only the type that passed parity goes to Jev ──
const policy = policyFromParity(rows);
assert.deepEqual(policy.perDecision, { "risk.classifyOperation": "jev" });
const incumbent = new FakeDecision(() => ({ value: "from-claude", confidence: 1 }));
const routed = new RoutedDecision(incumbent, jev, policy);
assert.equal((await routed.decide({ name: "risk.classifyOperation", state: {}, candidates: ["safe", "risky"] })).provider, "jev");
assert.equal((await routed.decide({ name: "qa.scoreEvidence", state: {}, candidates: ["pass", "fail"] })).value, "from-claude");

console.log("jev check passed (documented contract, pinned model, retries then stop, state fitted, parity per type, only passing types routed)");
