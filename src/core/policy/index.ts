// Policy layer: escalation thresholds (#8) + provider routing / Jev parity (#10).
// The resolvers are pure deterministic logic — no runtime data / Jev access needed.
// Only the threshold *values* and the swap *decision* need calibration/access later.

import { z } from "zod";
import type { DecisionName } from "../decision/index.js";

// ── #8 Escalation thresholds ──────────────────────────────
export type EscalationPath = "accept" | "llm" | "human";

export const ThresholdPolicySchema = z.object({
  version: z.string(),
  default: z.object({
    high: z.number().min(0).max(1),
    mid: z.number().min(0).max(1),
  }),
  perDecision: z
    .record(
      z.object({
        high: z.number().min(0).max(1).optional(),
        mid: z.number().min(0).max(1).optional(),
        /** Always route to a human gate regardless of confidence. */
        alwaysGate: z.boolean().optional(),
      }),
    )
    .default({}),
});
export type ThresholdPolicy = z.infer<typeof ThresholdPolicySchema>;

/**
 * Placeholder starting values until calibration (decision #38).
 * Recalibrate from logged (decision, confidence, outcome) → reliability curve.
 * NOTE: "security-sensitive outcomes always gate" is a VALUE-level rule applied
 * to a risk.classifyOperation result downstream — not encoded here (this resolver
 * only sees name + confidence).
 */
export const DEFAULT_THRESHOLDS: ThresholdPolicy = {
  version: "0-placeholder",
  default: { high: 0.85, mid: 0.6 },
  perDecision: {
    "map.classifyFileToDesign": { high: 0.9 }, // mapping errors propagate → stricter
  },
};

/** Pure escalation resolver (decision #15/#38). */
export function resolveEscalation(
  name: DecisionName,
  confidence: number,
  policy: ThresholdPolicy = DEFAULT_THRESHOLDS,
): EscalationPath {
  const o = policy.perDecision[name] ?? {};
  if (o.alwaysGate) return "human";
  const high = o.high ?? policy.default.high;
  const mid = o.mid ?? policy.default.mid;
  if (confidence >= high) return "accept";
  if (confidence >= mid) return "llm";
  return "human";
}

// ── #10 Provider routing + Jev parity ─────────────────────
export type ProviderId = "claude-wrapper" | "jev";

export const ProviderPolicySchema = z.object({
  version: z.string(),
  /** Provider for decision types not listed in perDecision. */
  default: z.enum(["claude-wrapper", "jev"]),
  perDecision: z.record(z.enum(["claude-wrapper", "jev"])).default({}),
  /** Tolerances a decision type must pass on the parity corpus before swapping to jev. */
  parity: z.object({
    minAgreement: z.number().min(0).max(1), // candidate vs incumbent on the same state
    maxCalibrationError: z.number().min(0).max(1), // ECE/Brier tolerance
  }),
});
export type ProviderPolicy = z.infer<typeof ProviderPolicySchema>;

export const DEFAULT_PROVIDERS: ProviderPolicy = {
  version: "0",
  default: "claude-wrapper",
  perDecision: {},
  parity: { minAgreement: 0.95, maxCalibrationError: 0.05 },
};

/** Which provider serves a decision type (decision #10: per-type, behind a flag). */
export function providerFor(
  name: DecisionName,
  policy: ProviderPolicy = DEFAULT_PROVIDERS,
): ProviderId {
  return policy.perDecision[name] ?? policy.default;
}

// The parity harness itself (record → replay → compare per type → swap/rollback)
// is a documented spec in docs/architecture.md; its execution needs Jev access +
// a real decision corpus, so it is intentionally not implemented here yet.
