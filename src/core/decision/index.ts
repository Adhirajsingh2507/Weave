// Decision layer seam (decisions #13-#18, #29, #38).
// unstructured state in -> typed probabilistic decision out (+ calibrated confidence).
// Provider now: our own wrapper on Claude structured outputs; Jev later. Same interface.

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
  provider: "claude-wrapper" | "jev";
  escalated?: "llm" | "human";
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
