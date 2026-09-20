// ponytail: one runnable check for the escalation resolver + provider routing.

import assert from "node:assert/strict";
import {
  resolveEscalation,
  providerFor,
  DEFAULT_PROVIDERS,
  ThresholdPolicySchema,
  DEFAULT_THRESHOLDS,
} from "./index.js";

// Default thresholds: 0.85 / 0.6.
assert.equal(resolveEscalation("qa.scoreEvidence", 0.9), "accept");
assert.equal(resolveEscalation("qa.scoreEvidence", 0.7), "llm");
assert.equal(resolveEscalation("qa.scoreEvidence", 0.3), "human");

// Stricter high for mapping (0.9): 0.88 accepts by default but escalates for mapping.
assert.equal(resolveEscalation("qa.scoreEvidence", 0.88), "accept");
assert.equal(resolveEscalation("map.classifyFileToDesign", 0.88), "llm");

// alwaysGate wins regardless of confidence.
assert.equal(
  resolveEscalation("route.branch", 0.99, {
    version: "t",
    default: { high: 0.85, mid: 0.6 },
    perDecision: { "route.branch": { alwaysGate: true } },
  }),
  "human",
);

// Provider routing defaults to the incumbent; per-type override swaps to jev.
assert.equal(providerFor("route.branch"), "claude-wrapper");
assert.equal(
  providerFor("route.branch", { ...DEFAULT_PROVIDERS, perDecision: { "route.branch": "jev" } }),
  "jev",
);

// The default policy is itself valid.
ThresholdPolicySchema.parse(DEFAULT_THRESHOLDS);

console.log("policy check passed");
