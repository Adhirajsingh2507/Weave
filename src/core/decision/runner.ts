// DecisionRunner — the decision layer's control point: decide → route by confidence →
// log to the corpus. The corpus feeds #8 calibration and #10 parity (decision #38/#39).

import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { resolveEscalation, DEFAULT_THRESHOLDS } from "../policy/index.js";
import type { EscalationPath, ThresholdPolicy } from "../policy/index.js";
import type { Decision, DecisionRequest, DecisionResult } from "./index.js";

export interface DecisionRunnerOptions {
  thresholds?: ThresholdPolicy;
  /** Append-only decision corpus (JSONL) for calibration/parity replay. */
  corpusPath?: string;
  /** Include the input state in the corpus (needed for #10 replay). Default true. */
  recordState?: boolean;
}

export interface DecisionOutcome<R = unknown> {
  result: DecisionResult<R>;
  escalation: EscalationPath;
}

export class DecisionRunner {
  #provider: Decision;
  #thresholds: ThresholdPolicy;
  #corpusPath: string | undefined;
  #recordState: boolean;

  constructor(provider: Decision, opts: DecisionRunnerOptions = {}) {
    this.#provider = provider;
    this.#thresholds = opts.thresholds ?? DEFAULT_THRESHOLDS;
    this.#corpusPath = opts.corpusPath;
    this.#recordState = opts.recordState ?? true;
  }

  async run<T, R>(req: DecisionRequest<T>): Promise<DecisionOutcome<R>> {
    const result = await this.#provider.decide<T, R>(req);
    const escalation = resolveEscalation(req.name, result.confidence, this.#thresholds);
    this.#log(req, result, escalation);
    return { result, escalation };
  }

  #log(req: DecisionRequest, result: DecisionResult, escalation: EscalationPath): void {
    if (!this.#corpusPath) return;
    const entry = {
      ts: new Date().toISOString(),
      name: req.name,
      value: result.value,
      confidence: result.confidence,
      provider: result.provider,
      ...(result.model ? { model: result.model } : {}),
      ...(result.usage ? { usage: result.usage } : {}),
      escalation,
      ...(this.#recordState ? { state: req.state, candidates: req.candidates } : {}),
    };
    mkdirSync(dirname(this.#corpusPath), { recursive: true });
    appendFileSync(this.#corpusPath, JSON.stringify(entry) + "\n", "utf8");
  }
}
