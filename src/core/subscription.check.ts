// D1 — decisions and vision through the subscription, driven with a stand-in `claude`: a valid
// answer comes back typed with the model that gave it; one invalid answer is retried; a second
// invalid answer, a rate limit or a different model is a ModelUnavailableError, never a guess.
// Every call is isolated from the user's setup, and vision may only read the image's folder.

import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ModelUnavailableError } from "./decision/index.js";
import { DecisionRunner } from "./decision/runner.js";
import { ClaudeCodeDecision, ClaudeCodeVisionExtractor, ClaudeCodeVisionInterpreter } from "./subscription.js";

const dir = mkdtempSync(join(tmpdir(), "weave-sub-"));
const bin = join(dir, "claude");
const mode = join(dir, "mode");
const calls = join(dir, "calls");
// The stand-in answers per `mode`, logging each argv (one per line) to `calls`.
writeFileSync(
  bin,
  `#!/bin/sh
printf '%s' "$*" | tr '\\n' ' ' >> "${calls}"; echo >> "${calls}"
m=$(cat "${mode}")
n=$(wc -l < "${calls}")
ok='"is_error":false,"subtype":"success","modelUsage":{"claude-opus-5-5":{}}'
case "$m" in
  good) echo "{$ok,\\"structured_output\\":{\\"value\\":\\"risky\\",\\"confidence\\":0.91}}";;
  flaky) if [ "$n" -eq 1 ]; then echo "{$ok,\\"structured_output\\":{\\"value\\":\\"maybe\\",\\"confidence\\":2}}"; else echo "{$ok,\\"structured_output\\":{\\"value\\":\\"safe\\",\\"confidence\\":0.8}}"; fi;;
  bad) echo "{$ok,\\"structured_output\\":{\\"nope\\":1}}";;
  limit) echo '{"is_error":true,"subtype":"success","result":"Claude AI usage limit reached|1759300000"}'; exit 1;;
  swapped) echo '{"is_error":false,"subtype":"success","modelUsage":{"claude-sonnet-5-5":{}},"structured_output":{"value":"safe","confidence":0.9}}';;
  facts) echo "{$ok,\\"structured_output\\":{\\"regions\\":[{\\"name\\":\\"hero\\",\\"contents\\":[\\"robot\\"]}],\\"media\\":[],\\"problems\\":[]}}";;
  intake) echo "{$ok,\\"structured_output\\":{\\"projectName\\":\\"Go2\\",\\"mood\\":\\"dark precise\\",\\"sections\\":[{\\"id\\":\\"hero\\",\\"name\\":\\"Hero\\",\\"kind\\":\\"section\\"}],\\"fields\\":{\\"colorMode\\":\\"dark\\",\\"layoutSystem\\":\\"centered\\",\\"layoutDensity\\":\\"spacious\\",\\"typographyScale\\":\\"display\\"},\\"styleHints\\":[\\"robotics\\"]}}";;
esac
`,
);
chmodSync(bin, 0o755);
const reset = (m: string): void => {
  writeFileSync(mode, m);
  writeFileSync(calls, "");
};
const argv = (): string[] => readFileSync(calls, "utf8").split("\n").filter(Boolean);
const decision = new ClaudeCodeDecision({ bin });
const req = { name: "risk.classifyOperation" as const, state: { diff: "+ fetch(evil)" }, candidates: ["safe", "risky"] };

// A valid answer: typed, with the model, isolated, no tools, the enum in the schema.
reset("good");
const corpus = join(dir, "decisions.jsonl");
const { result } = await new DecisionRunner(decision, { corpusPath: corpus }).run<unknown, string>(req);
assert.deepEqual([result.value, result.confidence, result.provider, result.model], ["risky", 0.91, "claude-code", "claude-opus-5-5"]);
assert.equal(JSON.parse(readFileSync(corpus, "utf8").trim())["model"], "claude-opus-5-5", "the corpus records who answered");
const call = argv()[0]!;
for (const flag of ["--model claude-opus-5-5", "--output-format json", "--strict-mcp-config", "--setting-sources", "--no-session-persistence"]) assert.ok(call.includes(flag), `missing ${flag}`);
assert.match(call, /"enum":\["safe","risky"\]/, "the candidates are enforced by the schema");

// One invalid answer is retried; the second try is used.
reset("flaky");
assert.equal((await decision.decide<unknown, string>(req)).value, "safe");
assert.equal(argv().length, 2);

// Two invalid answers, a rate limit, or another model answering: stop and ask.
for (const m of ["bad", "limit", "swapped"]) {
  reset(m);
  await assert.rejects(decision.decide(req), ModelUnavailableError, m);
}
reset("limit");
await decision.decide(req).catch(() => undefined);
assert.equal(argv().length, 1, "a rate limit is not retried into a second refusal");

// Vision: the CLI reads the file itself, with Read only, confined to the image's folder.
const shot = join(dir, "shots", "page.png");
reset("facts");
const facts = await new ClaudeCodeVisionExtractor({ bin }).extract(shot);
assert.deepEqual((facts["regions"] as Array<{ name: string }>)[0]!.name, "hero");
assert.ok(argv()[0]!.includes(`--tools Read --allowedTools Read --add-dir ${join(dir, "shots")}`), argv()[0]);
reset("intake");
const read = await new ClaudeCodeVisionInterpreter({ bin }).interpret({ screenshots: [shot], text: "a robot dog" });
assert.equal(read.fields.colorMode, "dark");

console.log("subscription check passed (typed + model recorded, one retry, refusal/limit/swap stop, isolated, vision confined to its folder)");
