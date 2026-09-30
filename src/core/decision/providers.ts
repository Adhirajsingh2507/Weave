// Decision providers (the decision layer). ClaudeDecision = API mode: Claude structured outputs
// through the official SDK, billed per token. ClaudeCodeDecision (subscription.ts) is the default,
// on the `claude` login. FakeDecision = deterministic, for tests/offline. All implement `Decision`.

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z4 from "zod/v4";
import { DECISION_MODEL, ModelUnavailableError } from "./index.js";
import type { Decision, DecisionRequest, DecisionResult } from "./index.js";

export interface ClaudeDecisionOptions {
  /** Defaults to the SDK's own lookup (ANTHROPIC_API_KEY). */
  client?: Anthropic;
  model?: string;
}

/**
 * API mode (WEAVE_MODE=api): one structured-output call per decision, schema-validated by the
 * SDK. The enum is enforced by the schema, so an off-candidate value cannot come back. A refusal
 * is a ModelUnavailableError, as on the subscription path.
 */
export class ClaudeDecision implements Decision {
  #client: Anthropic | undefined;
  #model: string;

  constructor(opts: ClaudeDecisionOptions = {}) {
    this.#client = opts.client;
    this.#model = opts.model ?? DECISION_MODEL;
  }

  async decide<T, R>(req: DecisionRequest<T>): Promise<DecisionResult<R>> {
    const client = (this.#client ??= new Anthropic());
    const value = req.candidates?.length ? z4.enum(req.candidates as [string, ...string[]]) : z4.string();
    const schema = z4.object({ value, confidence: z4.number().min(0).max(1) });
    const response = await client.beta.messages.parse({
      model: this.#model,
      max_tokens: 1024,
      output_config: { format: betaZodOutputFormat(schema) },
      messages: [
        {
          role: "user",
          content:
            `Make the structured decision '${req.name}'. Return the value and a calibrated confidence in [0,1].\n` +
            (req.candidates?.length ? `Candidates: ${JSON.stringify(req.candidates)}\n` : "") +
            `State:\n${JSON.stringify(req.state, null, 2)}`,
        },
      ],
    });
    if (response.stop_reason === "refusal") throw new ModelUnavailableError(`${this.#model} refused the decision '${req.name}'`);
    if (!response.parsed_output) throw new ModelUnavailableError(`no structured decision (stop: ${response.stop_reason})`);
    return { value: response.parsed_output.value as R, confidence: response.parsed_output.confidence, provider: "claude-wrapper", model: response.model };
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
