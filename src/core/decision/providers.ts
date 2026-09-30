// Decision providers (the decision layer). ClaudeDecision = our wrapper on Claude structured
// outputs via the Messages API (tool-forced JSON). FakeDecision = deterministic, for
// tests/offline. Both implement the same `Decision` interface (decision #14/#29).

import type { Decision, DecisionRequest, DecisionResult } from "./index.js";

export interface ClaudeDecisionOptions {
  /** Defaults to env ANTHROPIC_API_KEY. */
  apiKey?: string;
  /** The decision layer is meant to be fast/cheap; Sonnet is a safe default. */
  model?: string;
  baseUrl?: string;
}

interface AnthropicToolUse {
  type: string;
  name?: string;
  input?: { value?: unknown; confidence?: unknown };
}
interface AnthropicResponse {
  content?: AnthropicToolUse[];
}

/**
 * Real provider: forces a single structured tool call { value, confidence }.
 * Requires ANTHROPIC_API_KEY at runtime; not exercised in offline self-checks.
 */
export class ClaudeDecision implements Decision {
  #apiKey: string | undefined;
  #model: string;
  #baseUrl: string;

  constructor(opts: ClaudeDecisionOptions = {}) {
    this.#apiKey = opts.apiKey ?? process.env["ANTHROPIC_API_KEY"];
    this.#model = opts.model ?? "claude-sonnet-5";
    this.#baseUrl = opts.baseUrl ?? "https://api.anthropic.com";
  }

  async decide<T, R>(req: DecisionRequest<T>): Promise<DecisionResult<R>> {
    if (!this.#apiKey) {
      throw new Error("ClaudeDecision: ANTHROPIC_API_KEY is not set.");
    }
    const valueSchema = req.candidates
      ? { type: "string", enum: req.candidates }
      : { type: "string" };
    const body = {
      model: this.#model,
      max_tokens: 512,
      tools: [
        {
          name: "decide",
          description: `Make the structured decision '${req.name}'. Return the chosen value and a calibrated confidence in [0,1].`,
          input_schema: {
            type: "object",
            properties: {
              value: valueSchema,
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["value", "confidence"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "decide" },
      messages: [
        {
          role: "user",
          content:
            `Decision: ${req.name}\n` +
            (req.candidates ? `Candidates: ${JSON.stringify(req.candidates)}\n` : "") +
            `State:\n${JSON.stringify(req.state, null, 2)}`,
        },
      ],
    };

    const res = await fetch(`${this.#baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.#apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`ClaudeDecision: HTTP ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as AnthropicResponse;
    const toolUse = json.content?.find((c) => c.type === "tool_use" && c.name === "decide");
    if (!toolUse?.input) throw new Error("ClaudeDecision: no structured tool_use in response.");

    const confidence = Number(toolUse.input.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new Error(`ClaudeDecision: invalid confidence ${String(toolUse.input.confidence)}`);
    }
    const value = toolUse.input.value;
    // Enforce the enum ourselves — the decision layer must never return an off-candidate value.
    if (req.candidates && !req.candidates.includes(String(value))) {
      throw new Error(`ClaudeDecision: value '${String(value)}' not in candidates ${JSON.stringify(req.candidates)}`);
    }
    return { value: value as R, confidence, provider: "claude-wrapper" };
  }
}

/** Deterministic provider for tests/offline. */
export class FakeDecision implements Decision {
  #fn: (req: DecisionRequest) => { value: unknown; confidence: number };

  constructor(fn: (req: DecisionRequest) => { value: unknown; confidence: number }) {
    this.#fn = fn;
  }

  async decide<T, R>(req: DecisionRequest<T>): Promise<DecisionResult<R>> {
    const { value, confidence } = this.#fn(req as DecisionRequest);
    return { value: value as R, confidence, provider: "claude-wrapper" };
  }
}
