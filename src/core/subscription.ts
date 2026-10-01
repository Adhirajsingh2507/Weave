// D1 — the decision layer and vision through the Claude subscription (decision #80): `claude -p`
// headless with a JSON Schema, isolated from the user's setup, Opus 5.5 pinned. The answer is
// validated with Zod and retried once; a refusal, a rate limit, a different model answering or a
// second invalid answer is a ModelUnavailableError — the caller stops and asks, never guesses.

import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import * as z4 from "zod/v4";
import { DECISION_MODEL, ModelUnavailableError } from "./decision/index.js";
import type { Decision, DecisionRequest, DecisionResult } from "./decision/index.js";
import { VisionFactsSchema } from "./intake.js";
import type { VisionFacts, VisionInterpreter } from "./intake.js";
import { ISOLATED_CLAUDE_ARGS, scrubbedEnv } from "./runtime.js";
import { PageFactsSchema } from "./visual.js";
import type { VisionExtractor } from "./visual.js";

const run = promisify(execFile);

export interface SubscriptionOptions {
  bin?: string;
  model?: string;
  timeoutMs?: number;
}

interface CliResult {
  is_error?: boolean;
  subtype?: string;
  result?: string;
  api_error_status?: number | null;
  structured_output?: unknown;
  modelUsage?: Record<string, unknown>;
  usage?: Record<string, number>;
  total_cost_usd?: number;
}

export interface CallUsage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  /** What the call would cost at API prices; on a subscription it is a measure, not a bill. */
  costUsd?: number;
}
const usageOf = (r: CliResult): CallUsage => ({
  input: r.usage?.["input_tokens"] ?? 0,
  output: r.usage?.["output_tokens"] ?? 0,
  cacheRead: r.usage?.["cache_read_input_tokens"] ?? 0,
  cacheWrite: r.usage?.["cache_creation_input_tokens"] ?? 0,
  ...(typeof r.total_cost_usd === "number" ? { costUsd: r.total_cost_usd } : {}),
});

/** One validated JSON answer from `claude -p`, and the model that gave it. */
export async function claudeJson<T>(
  prompt: string,
  schema: z4.ZodType<T>,
  opts: SubscriptionOptions & { images?: string[] } = {},
): Promise<{ data: T; model: string; usage: CallUsage }> {
  const model = opts.model ?? DECISION_MODEL;
  const images = (opts.images ?? []).map((p) => resolve(p));
  // Images are read with the Read tool, only from the folders that hold them; nothing else is
  // available — no shell, no edits, no web.
  const tools = images.length ? ["--tools", "Read", "--allowedTools", "Read", ...[...new Set(images.map(dirname))].flatMap((d) => ["--add-dir", d])] : ["--tools", ""];
  const args = [
    "-p", prompt,
    "--model", model,
    "--output-format", "json",
    // The CLI's validator rejects Zod's `$schema` draft-2020-12 URI (observed); the rest is fine.
    "--json-schema", JSON.stringify({ ...(z4.toJSONSchema(schema) as Record<string, unknown>), $schema: undefined }),
    "--no-session-persistence",
    ...tools,
    ...ISOLATED_CLAUDE_ARGS,
  ];
  let last = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    let res: CliResult;
    try {
      const { stdout } = await run(opts.bin ?? "claude", args, {
        encoding: "utf8",
        timeout: opts.timeoutMs ?? 300_000,
        maxBuffer: 1 << 26,
        env: { ...scrubbedEnv(), CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1" },
      });
      res = JSON.parse(stdout) as CliResult;
    } catch (e) {
      // A non-zero exit still prints the JSON result when the CLI got that far.
      const { stdout, stderr } = e as { stdout?: string; stderr?: string };
      try {
        res = JSON.parse(stdout ?? "") as CliResult;
      } catch {
        throw new ModelUnavailableError(`claude -p failed: ${(stderr || stdout || (e as Error).message).trim().split("\n")[0]!.slice(0, 300)}`);
      }
    }
    const text = String(res.result ?? "");
    if (res.is_error && (res.api_error_status === 429 || res.api_error_status === 529 || /limit|rate|overload/i.test(text))) {
      throw new ModelUnavailableError(`${model} rate-limited or over the plan's limit: ${text.slice(0, 200)}`);
    }
    const answered = Object.keys(res.modelUsage ?? {});
    if (!res.is_error && answered.length && !answered.includes(model)) {
      throw new ModelUnavailableError(`${model} was asked, ${answered.join(", ")} answered — no silent switch`);
    }
    if (res.subtype === "refusal" || /\brefus/i.test(res.subtype ?? "")) throw new ModelUnavailableError(`${model} refused: ${text.slice(0, 200)}`);
    const parsed = schema.safeParse(res.structured_output);
    if (!res.is_error && parsed.success) return { data: parsed.data, model: answered[0] ?? model, usage: usageOf(res) };
    last = res.is_error ? `${res.subtype}: ${text.slice(0, 200)}` : `invalid answer: ${parsed.error?.issues[0]?.message ?? "no structured output"}`;
  }
  throw new ModelUnavailableError(`no valid answer after a retry (${last})`);
}

/** The decision layer on the subscription: one typed decision per call, as the seam asks. */
export class ClaudeCodeDecision implements Decision {
  #opts: SubscriptionOptions;
  constructor(opts: SubscriptionOptions = {}) {
    this.#opts = opts;
  }

  async decide<T, R>(req: DecisionRequest<T>): Promise<DecisionResult<R>> {
    const value = req.candidates?.length ? z4.enum(req.candidates as [string, ...string[]]) : z4.string();
    const schema = z4.object({
      value: value.describe("the decision"),
      confidence: z4.number().min(0).max(1).describe("calibrated probability that the value is right"),
    });
    const prompt =
      `You are a decision function in a software pipeline. Make the decision '${req.name}' from the state below. ` +
      `Answer with the value and a calibrated confidence; do not explain.\n` +
      (req.candidates?.length ? `Candidates: ${JSON.stringify(req.candidates)}\n` : "") +
      `State:\n${JSON.stringify(req.state, null, 2)}`;
    const { data, model, usage } = await claudeJson(prompt, schema, this.#opts);
    return { value: data.value as R, confidence: data.confidence, provider: "claude-code", model, usage };
  }
}

/** Screenshot intake through the subscription: the CLI reads the image files itself. */
export class ClaudeCodeVisionInterpreter implements VisionInterpreter {
  #opts: SubscriptionOptions;
  constructor(opts: SubscriptionOptions = {}) {
    this.#opts = opts;
  }

  async interpret({ screenshots, text }: { screenshots: string[]; text?: string }): Promise<VisionFacts> {
    const prompt =
      `Read these screenshot files with the Read tool: ${screenshots.map((s) => resolve(s)).join(", ")}. ` +
      "They show a website design to be rebuilt. Read its structure top to bottom and describe it for a design compiler. " +
      "Report what you see, not what you would design; if a field is ambiguous, say so in your own words rather than forcing a category." +
      (text ? `\n\nThe author also wrote:\n${text}` : "");
    return (await claudeJson(prompt, VisionFactsSchema, { ...this.#opts, images: screenshots })).data;
  }
}

/** Visual QA facts through the subscription (the hybrid path, decision #16). */
export class ClaudeCodeVisionExtractor implements VisionExtractor {
  #opts: SubscriptionOptions;
  constructor(opts: SubscriptionOptions = {}) {
    this.#opts = opts;
  }

  async extract(screenshotPath: string): Promise<Record<string, unknown>> {
    const prompt =
      `Read the screenshot file ${resolve(screenshotPath)} with the Read tool. It is a rendered web page. ` +
      "Report what is actually visible, region by region: every image, illustration, 3D render and video, where it sits and how wide it is, " +
      "and anything visibly broken. An element that is present but renders empty or blank is a problem, not media.";
    return (await claudeJson(prompt, PageFactsSchema, { ...this.#opts, images: [screenshotPath] })).data;
  }
}
