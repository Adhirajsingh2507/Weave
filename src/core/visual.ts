// Phase 5 — hybrid visual QA (decision #16): vision LLM extracts structured facts →
// decision layer scores vs criteria → low-confidence triggers a deliberate pixel re-check.

import { DecisionRunner } from "./decision/runner.js";
import type { Decision } from "./decision/index.js";
import type { ThresholdPolicy } from "./policy/index.js";

/** Turns a screenshot into structured facts (real impl = a vision LLM; fake in tests). */
export interface VisionExtractor {
  extract(screenshotPath: string): Promise<Record<string, unknown>>;
}

/** Deliberate re-inspection of the actual pixels on low confidence. */
export interface VisionReinspector {
  reinspect(screenshotPath: string, criterion: VisualCriterion): Promise<{ ok: boolean }>;
}

export interface VisualCriterion {
  id: string;
  description: string;
}

export interface VisualResult {
  ok: boolean;
  results: Array<{
    criterion: string;
    value: unknown;
    confidence: number;
    escalation: string;
    pass: boolean;
  }>;
}

export interface VisualQAOptions {
  screenshotPath: string;
  criteria: VisualCriterion[];
  extractor: VisionExtractor;
  decision: Decision;
  reinspector?: VisionReinspector;
  thresholds?: ThresholdPolicy;
}

export async function visualQA(opts: VisualQAOptions): Promise<VisualResult> {
  const facts = await opts.extractor.extract(opts.screenshotPath);
  const runner = new DecisionRunner(opts.decision, { thresholds: opts.thresholds });
  const results: VisualResult["results"] = [];
  let ok = true;

  for (const c of opts.criteria) {
    const { result, escalation } = await runner.run({
      name: "qa.scoreEvidence",
      state: { criterion: c, facts },
      candidates: ["pass", "fail", "partial"],
    });
    let pass = result.value === "pass";
    // Low confidence → deliberate pixel re-check (the "hybrid" step).
    if (escalation !== "accept" && opts.reinspector) {
      pass = (await opts.reinspector.reinspect(opts.screenshotPath, c)).ok;
    }
    ok = ok && pass;
    results.push({ criterion: c.id, value: result.value, confidence: result.confidence, escalation, pass });
  }

  return { ok, results };
}
