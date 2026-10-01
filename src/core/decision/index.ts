// Decision layer seam (decisions #13-#18, #29, #38).
// unstructured state in -> typed probabilistic decision out (+ calibrated confidence).
// Provider now: our own wrapper on Claude structured outputs; Jev later. Same interface.

/** The model decisions and vision run on, in both modes (decision #80). */
export const DECISION_MODEL = "claude-opus-5-5";

/** v1 decision-schema catalog (decision #7). Each has a typed schema in policies/decisions/. */
export type DecisionName =
  | "ingest.classifyFileRole"
  | "interpret.normalizeField"
  | "map.classifyFileToDesign"
  | "criteria.normalizeMeasurable"
  | "qa.scoreEvidence"
  | "risk.classifyOperation"
  | "route.branch"
  | "gate.evaluate";

export const DECISION_CATALOG: readonly DecisionName[] = [
  "ingest.classifyFileRole",
  "interpret.normalizeField",
  "map.classifyFileToDesign",
  "criteria.normalizeMeasurable",
  "qa.scoreEvidence",
  "risk.classifyOperation",
  "route.branch",
  "gate.evaluate",
];

export interface DecisionRequest<T = unknown> {
  name: DecisionName;
  state: T;
  /** Bounded/enum choices. Cardinality <= 255 (Jev constraint); prefilter beyond that. */
  candidates?: string[];
}

export interface DecisionResult<R = unknown> {
  value: R;
  /** 0..1, calibrated. Drives the escalation ladder. */
  confidence: number;
  provider: "claude-wrapper" | "claude-code" | "jev";
  /** The model that actually answered, when the provider reports it. */
  model?: string;
  /** Tokens and the plan's cost-equivalent for this call, when the provider reports them. */
  usage?: { input: number; output: number; cacheRead: number; cacheWrite: number; costUsd?: number };
  escalated?: "llm" | "human";
}

/**
 * The pinned model refused, was rate-limited, was swapped for another, or gave no valid answer
 * after a retry (decision #80). Callers stop and ask a person; they never guess or fall back.
 */
export class ModelUnavailableError extends Error {
  override name = "ModelUnavailableError";
}

export interface Decision {
  decide<T, R>(req: DecisionRequest<T>): Promise<DecisionResult<R>>;
}

/** Placeholder until the Claude-structured wrapper is wired. Keeps the seam typed. */
export class UnimplementedDecision implements Decision {
  async decide<T, R>(_req: DecisionRequest<T>): Promise<DecisionResult<R>> {
    throw new Error(
      "Decision provider not wired yet (Claude-structured wrapper -> Jev later).",
    );
  }
}
