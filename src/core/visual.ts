// Phase 5 — hybrid visual QA (decision #16): vision LLM extracts structured facts →
// decision layer scores vs criteria → low-confidence triggers a deliberate pixel re-check.

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z4 from "zod/v4";
import { readFileSync } from "node:fs";
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

/** What a vision pass reports about a rendered page: what is visible, and where. */
export const PageFactsSchema = z4.object({
  regions: z4.array(
    z4.object({
      name: z4.string().describe("the region's role: header, hero, features, footer, …"),
      contents: z4.array(z4.string()).describe("what is visibly in it, briefly"),
    }),
  ),
  media: z4.array(
    z4.object({
      description: z4.string(),
      kind: z4.string().describe("photo, illustration, 3D render, video, icon, or empty placeholder"),
      region: z4.string(),
      widthPct: z4.number().describe("approximate width as a percentage of the page width"),
    }),
  ),
  problems: z4.array(z4.string()).describe("visible breakage: missing images, overlapping text, empty boxes, …"),
});

/**
 * Claude vision reading a screenshot for visual QA (V2.7), through the official SDK with
 * structured outputs and server-side refusal fallback. It reports facts; it does not judge —
 * scoring against criteria is the decision layer's job.
 */
export class ClaudeVisionExtractor implements VisionExtractor {
  #client: Anthropic;
  #model: string;

  constructor(opts: { client?: Anthropic; model?: string } = {}) {
    this.#client = opts.client ?? new Anthropic();
    this.#model = opts.model ?? "claude-opus-5-5";
  }

  async extract(screenshotPath: string): Promise<Record<string, unknown>> {
    const response = await this.#client.beta.messages.parse({
      model: this.#model,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { format: betaZodOutputFormat(PageFactsSchema) },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/png", data: readFileSync(screenshotPath).toString("base64") } },
            {
              type: "text",
              text:
                "This is a screenshot of a rendered web page. Report what is actually visible, region by region: " +
                "every image, illustration, 3D render and video, where it sits and how wide it is, and anything visibly broken. " +
                "An element that is present but renders empty or blank is a problem, not media.",
            },
          ],
        },
      ],
    });
    if (response.stop_reason === "refusal") throw new Error("vision pass declined");
    if (!response.parsed_output) throw new Error(`vision pass returned no structured facts (stop: ${response.stop_reason})`);
    return response.parsed_output;
  }
}
