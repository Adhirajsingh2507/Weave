// D8 — Jev (TypeSafe's System One model) behind the Decision seam (decisions #14, #39, #84, #85).
// One state, typed questions, answered in parallel: a Weave decision with candidates is a Choice;
// its confidence is Jev's own, computed from the probability distribution. Jev does not generate,
// so a decision without candidates is not sent to it.
//
// The parity harness replays the decision corpus (what the incumbent decided, on the same state)
// through Jev and reports, per decision type, agreement and calibration (ECE of Jev's confidence
// against agreement). A type that passes the policy's tolerances can be switched to Jev; the rest
// stay where they are, and the report says which.
//
// Jev's known edges shape the questions (docs.typesafe.ai, jev-1.13 jaggedness): exact, literal
// instructions per decision type; criteria that say what each option means; state trimmed to what
// fits its 32k-token window; arithmetic kept in code.

import { readFileSync } from "node:fs";
import { DEFAULT_PROVIDERS, providerFor } from "../policy/index.js";
import type { ProviderPolicy } from "../policy/index.js";
import { ModelUnavailableError } from "./index.js";
import type { Decision, DecisionName, DecisionRequest, DecisionResult } from "./index.js";

export const JEV_MODEL = "jev-1.13.0";
export const JEV_URL = "https://api.typesafe.ai/v1/systemone";

/** A typed question, as the API takes it. */
export type JevQuestion =
  | { type: "choice"; instructions: unknown; criteria: Record<string, unknown> }
  | { type: "score"; instructions: unknown; criteria: unknown[] }
  | { type: "noul"; instructions: unknown; criteria?: { true?: unknown; false?: unknown } };

export type JevAnswer =
  | { type: "choice"; choice: string; probabilities: Record<string, number>; confidence: number }
  | { type: "score"; score: number; probabilities: Record<string, number>; confidence: number; legend: Record<string, string> }
  | { type: "noul"; noul: number };

/** What each decision type asks, worded for a literal reader, with what each option means. */
const QUESTIONS: Partial<Record<DecisionName, { instructions: string; criteria?: Record<string, string> }>> = {
  "risk.classifyOperation": {
    instructions: "Is the code change in `diff` (files listed in `changes`) safe to merge without a human reviewing it, or risky?",
    criteria: {
      safe: "Ordinary feature work: markup, styles, copy and local logic inside the files listed in `changes`. No new dependencies, no credentials, no requests to new hosts, no deleted files.",
      risky: "Adds or changes a dependency, reads or writes credentials or secrets, sends data to a host, deletes files, or weakens security headers, permissions or sandboxing.",
    },
  },
  "interpret.normalizeField": {
    instructions: "A designer described the design field `field` as `raw`. Which option is that description closest to?",
  },
  "qa.scoreEvidence": {
    instructions: "Do the observations in `facts` show that `criterion.description` is true of the rendered page?",
    criteria: {
      pass: "The facts show it fully.",
      partial: "The facts show it in part, or only some of what it asks.",
      fail: "The facts show it is not true, or say nothing that supports it.",
    },
  },
};

/** Keep the state inside Jev's window: shorten the longest strings until it fits. */
export function fitState(state: unknown, maxChars = 90_000): unknown {
  const copy = JSON.parse(JSON.stringify(state ?? {})) as unknown;
  const strings: Array<{ parent: Record<string, unknown> | unknown[]; key: string | number; len: number }> = [];
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === "string" ? strings.push({ parent: v, key: i, len: x.length }) : walk(x)));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) typeof x === "string" ? strings.push({ parent: v as Record<string, unknown>, key: k, len: x.length }) : walk(x);
  };
  walk(copy);
  let size = JSON.stringify(copy).length;
  for (const s of strings.sort((a, b) => b.len - a.len)) {
    if (size <= maxChars) break;
    const over = size - maxChars;
    const text = (s.parent as Record<string | number, string>)[s.key]!;
    const keep = Math.max(200, text.length - over - 40);
    (s.parent as Record<string | number, string>)[s.key] = `${text.slice(0, keep)}…[trimmed ${text.length - keep} chars]`;
    size = JSON.stringify(copy).length;
  }
  return copy;
}

export interface JevOptions {
  /** Default: TYPESAFE_API_KEY. */
  apiKey?: string;
  model?: string;
  url?: string;
  fetch?: typeof fetch;
  /** Retries on 429/529 before the model counts as unavailable. */
  retries?: number;
}

export class JevDecision implements Decision {
  #key: string | undefined;
  #model: string;
  #url: string;
  #fetch: typeof fetch;
  #retries: number;

  constructor(opts: JevOptions = {}) {
    this.#key = opts.apiKey ?? process.env["TYPESAFE_API_KEY"];
    this.#model = opts.model ?? JEV_MODEL;
    this.#url = opts.url ?? JEV_URL;
    this.#fetch = opts.fetch ?? fetch;
    this.#retries = opts.retries ?? 3;
  }

  /** Several typed questions about one state, in one call (the widened seam). */
  async ask(state: unknown, questions: Record<string, JevQuestion>): Promise<{ answers: Record<string, JevAnswer>; model: string; usage?: { input_tokens: number; output_tokens: number } }> {
    if (!this.#key) throw new Error("JevDecision: TYPESAFE_API_KEY is not set");
    const body = JSON.stringify({ state: fitState(state), model: this.#model, questions });
    for (let attempt = 0; ; attempt++) {
      const res = await this.#fetch(this.#url, { method: "POST", headers: { authorization: `Bearer ${this.#key}`, "content-type": "application/json" }, body });
      if (res.ok) return (await res.json()) as { answers: Record<string, JevAnswer>; model: string };
      const busy = res.status === 429 || res.status === 529;
      if (busy && attempt < this.#retries) {
        const after = Number(res.headers.get("retry-after"));
        await new Promise((r) => setTimeout(r, Number.isFinite(after) && after > 0 ? after * 1000 : 500 * 2 ** attempt));
        continue;
      }
      const detail = (await res.text()).slice(0, 300);
      if (busy) throw new ModelUnavailableError(`Jev ${res.status} after ${this.#retries} retries: ${detail}`);
      throw new Error(`Jev ${res.status}: ${detail}`);
    }
  }

  async decide<T, R>(req: DecisionRequest<T>): Promise<DecisionResult<R>> {
    if (!req.candidates?.length) throw new Error(`Jev answers typed questions only; '${req.name}' has no candidates`);
    if (req.candidates.length > 255) throw new Error(`Jev takes at most 255 options; '${req.name}' has ${req.candidates.length}`);
    const q = QUESTIONS[req.name];
    const criteria = Object.fromEntries(req.candidates.map((c) => [c, q?.criteria?.[c] ?? null]));
    const instructions = q?.instructions ?? `Make the decision "${req.name}" for this state. Which option is right?`;
    const { answers, model } = await this.ask(req.state, { decision: { type: "choice", instructions, criteria } });
    const a = answers["decision"];
    if (!a || a.type !== "choice") throw new ModelUnavailableError(`Jev returned no choice for '${req.name}'`);
    return { value: a.choice as R, confidence: a.confidence, provider: "jev", model };
  }
}

/** Serves each decision type from the provider the policy names (decision #39). No caller changes. */
export class RoutedDecision implements Decision {
  #incumbent: Decision;
  #jev: Decision;
  #policy: ProviderPolicy;
  constructor(incumbent: Decision, jev: Decision, policy: ProviderPolicy = DEFAULT_PROVIDERS) {
    this.#incumbent = incumbent;
    this.#jev = jev;
    this.#policy = policy;
  }
  decide<T, R>(req: DecisionRequest<T>): Promise<DecisionResult<R>> {
    return (providerFor(req.name, this.#policy) === "jev" ? this.#jev : this.#incumbent).decide<T, R>(req);
  }
}

// ── Parity ────────────────────────────────────────────────────

export interface CorpusEntry {
  name: DecisionName;
  value: unknown;
  confidence: number;
  provider: string;
  state?: unknown;
  candidates?: string[];
}

export interface ParityRow {
  name: DecisionName;
  n: number;
  agreement: number;
  /** Expected calibration error of Jev's confidence against agreeing with the incumbent. */
  calibrationError: number;
  /** Mean Jev confidence when it agreed / disagreed. */
  confidenceAgree: number | null;
  confidenceDisagree: number | null;
  errors: number;
  verdict: "switch" | "stay" | "too few";
  why: string;
}

export function readCorpus(path: string): CorpusEntry[] {
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as CorpusEntry)
    .filter((e) => e.provider !== "jev" && e.state !== undefined && e.candidates?.length);
}

/** Expected calibration error over equal-width confidence bins. */
export function ece(points: Array<{ confidence: number; correct: boolean }>, bins = 5): number {
  if (!points.length) return 0;
  let total = 0;
  for (let b = 0; b < bins; b++) {
    const lo = b / bins;
    const hi = (b + 1) / bins;
    const inBin = points.filter((p) => p.confidence >= lo && (b === bins - 1 ? p.confidence <= hi : p.confidence < hi));
    if (!inBin.length) continue;
    const acc = inBin.filter((p) => p.correct).length / inBin.length;
    const conf = inBin.reduce((s, p) => s + p.confidence, 0) / inBin.length;
    total += (inBin.length / points.length) * Math.abs(acc - conf);
  }
  return total;
}

/** Replay the corpus through Jev and judge each decision type against the policy's tolerances. */
export async function runParity(entries: CorpusEntry[], jev: Decision, policy: ProviderPolicy = DEFAULT_PROVIDERS, minN = 20): Promise<ParityRow[]> {
  const byName = new Map<DecisionName, CorpusEntry[]>();
  for (const e of entries) byName.set(e.name, [...(byName.get(e.name) ?? []), e]);
  const rows: ParityRow[] = [];
  for (const [name, list] of byName) {
    const points: Array<{ confidence: number; correct: boolean }> = [];
    let errors = 0;
    for (const e of list) {
      try {
        const r = await jev.decide({ name, state: e.state, candidates: e.candidates! });
        points.push({ confidence: r.confidence, correct: String(r.value) === String(e.value) });
      } catch (err) {
        if (err instanceof ModelUnavailableError) throw err; // rate-limited: stop and ask, never a partial verdict
        errors++;
      }
    }
    const agree = points.filter((p) => p.correct);
    const agreement = points.length ? agree.length / points.length : 0;
    const calibrationError = ece(points);
    const mean = (xs: typeof points): number | null => (xs.length ? xs.reduce((s, p) => s + p.confidence, 0) / xs.length : null);
    const enough = points.length >= minN;
    const passes = agreement >= policy.parity.minAgreement && calibrationError <= policy.parity.maxCalibrationError;
    rows.push({
      name,
      n: points.length,
      agreement,
      calibrationError,
      confidenceAgree: mean(agree),
      confidenceDisagree: mean(points.filter((p) => !p.correct)),
      errors,
      verdict: !enough ? "too few" : passes ? "switch" : "stay",
      why: !enough
        ? `${points.length} of ${minN} entries needed`
        : `agreement ${(agreement * 100).toFixed(1)}% (needs ${policy.parity.minAgreement * 100}%), ECE ${calibrationError.toFixed(3)} (needs ≤ ${policy.parity.maxCalibrationError})`,
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

/** The provider policy the parity verdicts recommend: only passing types move to Jev. */
export function policyFromParity(rows: ParityRow[], base: ProviderPolicy = DEFAULT_PROVIDERS): ProviderPolicy {
  return { ...base, version: String(Number(base.version) + 1), perDecision: { ...base.perDecision, ...Object.fromEntries(rows.filter((r) => r.verdict === "switch").map((r) => [r.name, "jev" as const])) } };
}
