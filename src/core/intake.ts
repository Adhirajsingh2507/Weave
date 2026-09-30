// V2.6 — multimodal intake (decision #24): the execution layer interprets, the decision layer
// normalises discrete fields with confidence, and a low-confidence reading gates instead of
// guessing silently. Provenance is recorded per element and per field.
//
//   text      → the line-directive brief, as before; explicit text always wins
//   screenshot→ a vision pass reads structure and raw values for the IR's enum fields
//   url       → the page's HTML, parsed deterministically (no model): title, landmarks, sections
//
// Figma is not here on purpose: an MCP client with Figma access can hand Weave the IR directly
// (`run` with `ir`); the engine does not call another server's tools.

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z4 from "zod/v4";
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { compileBrief } from "./compiler.js";
import type { BriefInput } from "./compiler.js";
import { DecisionRunner } from "./decision/runner.js";
import type { Decision } from "./decision/index.js";
import { loadStyle, suggestStyles } from "./design/style.js";
import { DesignIRSchema } from "./ir/schema.js";
import type { DesignIR, Interpretation } from "./ir/schema.js";

/** What a vision pass reads off a screenshot. Enum fields arrive raw; normalising is not its job. */
export const VisionFactsSchema = z4.object({
  projectName: z4.string().describe("the product or brand name shown, or empty if none"),
  mood: z4.string().describe("two to five words for the overall feel"),
  sections: z4.array(
    z4.object({
      id: z4.string().describe("short kebab-case id, e.g. hero, features, pricing"),
      name: z4.string(),
      kind: z4.string().describe("nav, section, footer, form, gallery, …"),
    }),
  ),
  fields: z4.object({
    colorMode: z4.string().describe("light, dark, or both — in your own words if unsure"),
    layoutSystem: z4.string().describe("how the layout is organised: grid, asymmetric, centered, split, …"),
    layoutDensity: z4.string().describe("how tightly packed: compact, comfortable, spacious, …"),
    typographyScale: z4.string().describe("how large the headline type runs: compact, default, large, display, …"),
  }),
  styleHints: z4.array(z4.string()).describe("words that describe the visual style: materials, eras, industries, references"),
});
export type VisionFacts = z4.infer<typeof VisionFactsSchema>;

/** The execution-layer seam for reading screenshots. Real: Claude vision. Checks: recorded. */
export interface VisionInterpreter {
  interpret(input: { screenshots: string[]; text?: string }): Promise<VisionFacts>;
}

const MEDIA: Record<string, "image/png" | "image/jpeg" | "image/webp" | "image/gif"> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * Claude vision via the official SDK, returning schema-validated JSON through structured outputs.
 * Server-side refusal fallback is on (the default for this model): a declined request is retried
 * on the fallback model inside the same call, and a chain that still refuses is an error, never
 * an empty reading.
 */
export class ClaudeVisionInterpreter implements VisionInterpreter {
  #client: Anthropic;
  #model: string;

  constructor(opts: { client?: Anthropic; model?: string } = {}) {
    this.#client = opts.client ?? new Anthropic();
    this.#model = opts.model ?? "claude-opus-5-5";
  }

  async interpret({ screenshots, text }: { screenshots: string[]; text?: string }): Promise<VisionFacts> {
    const images = screenshots.map((path) => {
      const media_type = MEDIA[extname(path).toLowerCase()];
      if (!media_type) throw new Error(`unsupported screenshot type: ${path} (png, jpeg, webp or gif)`);
      return { type: "image" as const, source: { type: "base64" as const, media_type, data: readFileSync(path).toString("base64") } };
    });
    const response = await this.#client.beta.messages.parse({
      model: this.#model,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { format: betaZodOutputFormat(VisionFactsSchema) },
      messages: [
        {
          role: "user",
          content: [
            ...images,
            {
              type: "text",
              text:
                "These screenshots show a website design to be rebuilt. Read its structure top to bottom and describe it " +
                "for a design compiler. Report what you see, not what you would design; if a field is ambiguous, say so " +
                "in your own words rather than forcing a category." +
                (text ? `\n\nThe author also wrote:\n${text}` : ""),
            },
          ],
        },
      ],
    });
    if (response.stop_reason === "refusal") {
      throw new Error(`vision pass declined${response.stop_details?.category ? ` (${response.stop_details.category})` : ""}`);
    }
    if (!response.parsed_output) throw new Error(`vision pass returned no structured reading (stop: ${response.stop_reason})`);
    return response.parsed_output;
  }
}

/** A recorded reading, for checks and replays: vision variance never makes a check flaky. */
export class RecordedVisionInterpreter implements VisionInterpreter {
  #facts: VisionFacts;
  constructor(facts: VisionFacts) {
    this.#facts = VisionFactsSchema.parse(facts);
  }
  async interpret(): Promise<VisionFacts> {
    return this.#facts;
  }
}

/** The IR's discrete fields a reading has to land in, with their allowed values. */
export const ENUM_FIELDS = [
  { key: "colorMode", path: ["colors", "mode"], candidates: ["light", "dark", "both"] },
  { key: "layoutSystem", path: ["layout", "system"], candidates: ["grid", "asymmetric", "centered", "split"] },
  { key: "layoutDensity", path: ["layout", "density"], candidates: ["compact", "comfortable", "spacious"] },
  { key: "typographyScale", path: ["typography", "scale"], candidates: ["compact", "default", "large", "display"] },
] as const;

/**
 * Without a decision provider, normalising is exact-match only: a reading that says "dark" is
 * dark, with confidence; one that says "moody, mostly black" is not guessed at — it goes to a
 * person. The decision layer is what earns confidence on the fuzzy ones.
 */
function normaliseDeterministic(raw: string, candidates: readonly string[]): { value: string; confidence: number } {
  const r = raw.trim().toLowerCase();
  const exact = candidates.find((c) => r === c);
  if (exact) return { value: exact, confidence: 1 };
  const contained = candidates.filter((c) => new RegExp(`\\b${c}\\b`).test(r));
  if (contained.length === 1) return { value: contained[0]!, confidence: 0.7 };
  return { value: contained[0] ?? candidates[0]!, confidence: 0.2 };
}

const slug = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";

/** Deterministic structure from a live page: its title and its landmark sections. */
export async function readUrl(url: string): Promise<{ projectName?: string; sections: Array<{ id: string; name: string; kind: string }> }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000), redirect: "follow" });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  const html = await res.text();
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim();
  const sections: Array<{ id: string; name: string; kind: string }> = [];
  const seen = new Set<string>();
  const push = (id: string, name: string, kind: string): void => {
    const s = slug(id);
    if (seen.has(s)) return;
    seen.add(s);
    sections.push({ id: s, name, kind });
  };
  for (const m of html.matchAll(/<(nav|header|footer|section|form)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const [, tag, attrs, inner] = m as unknown as [string, string, string, string];
    const id = /\bid=["']([^"']+)["']/i.exec(attrs)?.[1];
    const heading = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i.exec(inner)?.[1]?.replace(/<[^>]+>/g, "").trim();
    const kind = tag.toLowerCase() === "header" ? "nav" : tag.toLowerCase();
    push(id ?? heading ?? kind, heading ?? id ?? kind, kind);
  }
  return { ...(title ? { projectName: title } : {}), sections };
}

export interface MultimodalInput extends BriefInput {
  screenshots?: string[];
  url?: string;
}

/**
 * Compile a brief that may include screenshots and a URL. Text directives win over anything
 * read; readings add what the text did not say, each with its provenance and, for discrete
 * fields, a confidence that decides whether a person has to confirm it.
 */
export async function compileMultimodal(
  input: MultimodalInput,
  deps: { vision?: VisionInterpreter; decision?: Decision; corpusPath?: string },
): Promise<DesignIR> {
  const base = compileBrief(input);
  const ir: DesignIR = structuredClone(base);
  const interpretations: Interpretation[] = [];
  const has = (id: string): boolean => ir.components.some((c) => c.id === id) || ir.pages.some((p) => p.id === id);
  const addSection = (s: { id: string; name: string; kind: string }, source: { kind: "screenshot" | "url"; ref: string }): void => {
    const id = slug(s.id);
    if (has(id)) return;
    ir.components.push({ id, name: s.name || id, kind: s.kind || "section" });
    ir.provenance[id] = [...(ir.provenance[id] ?? []), source];
  };
  const hints: string[] = [];

  if (input.url) {
    const page = await readUrl(input.url);
    const source = { kind: "url" as const, ref: input.url };
    ir.meta.sourceInputs.push(source);
    if (!input.projectName && page.projectName) ir.meta.projectName = page.projectName;
    for (const s of page.sections) addSection(s, source);
  }

  if (input.screenshots?.length) {
    if (!deps.vision) throw new Error("screenshot intake needs a vision interpreter (log in with `claude`, or WEAVE_MODE=api with ANTHROPIC_API_KEY)");
    const facts = await deps.vision.interpret({ screenshots: input.screenshots, ...(input.text ? { text: input.text } : {}) });
    const source = { kind: "screenshot" as const, ref: input.screenshots.join(", ") };
    ir.meta.sourceInputs.push(...input.screenshots.map((ref) => ({ kind: "screenshot" as const, ref })));
    if (!input.projectName && facts.projectName) ir.meta.projectName = facts.projectName;
    ir.visualLanguage.mood = facts.mood || ir.visualLanguage.mood;
    ir.visualLanguage.keywords = [...new Set([...ir.visualLanguage.keywords, ...facts.styleHints])];
    for (const s of facts.sections) addSection(s, source);
    // A page to hold what was read, when the text named none.
    if (!ir.pages.length && facts.sections.length) {
      ir.pages.push({ id: "home", name: "Home", route: "/", sections: [] });
      ir.provenance["home"] = [source];
    }
    hints.push(facts.mood, ...facts.styleHints);

    const runner = deps.decision ? new DecisionRunner(deps.decision, { ...(deps.corpusPath ? { corpusPath: deps.corpusPath } : {}) }) : undefined;
    for (const f of ENUM_FIELDS) {
      const raw = facts.fields[f.key];
      let value: string;
      let confidence: number;
      let escalation: Interpretation["escalation"];
      if (runner) {
        const out = await runner.run<unknown, string>({
          name: "interpret.normalizeField",
          state: { field: f.path.join("."), raw, mood: facts.mood, hints: facts.styleHints },
          candidates: [...f.candidates],
        });
        value = String(out.result.value);
        confidence = out.result.confidence;
        escalation = out.escalation;
      } else {
        ({ value, confidence } = normaliseDeterministic(raw, f.candidates));
        escalation = confidence >= 0.85 ? "accept" : confidence >= 0.6 ? "llm" : "human";
      }
      (ir as unknown as Record<string, Record<string, string>>)[f.path[0]]![f.path[1]] = value;
      interpretations.push({ field: f.path.join("."), raw, value, confidence, escalation, source });
    }
  }

  // A style chosen from a reading is always confirmed by a person: it is the decision the whole
  // look rests on, and the guide's best_for is a heuristic, not a verdict.
  if (!ir.meta.style && (input.screenshots?.length || input.url)) {
    const suggestions = suggestStyles([input.text ?? "", ir.meta.projectName, ...hints].join(" "));
    if (suggestions.length) {
      const [top, ...rest] = suggestions;
      ir.meta.style = top!.slug;
      ir.designTokens = DesignIRSchema.shape.designTokens.parse(loadStyle(top!.slug).tokens);
      interpretations.push({
        field: "meta.style",
        raw: top!.reasons.join("; "),
        value: top!.slug,
        confidence: Math.min(0.5, top!.score / 20),
        escalation: "human",
        source: input.screenshots?.length ? { kind: "screenshot", ref: input.screenshots.join(", ") } : { kind: "url", ref: input.url! },
        alternatives: rest.map((s) => s.slug),
      });
    }
  }

  if (interpretations.length) ir.meta.interpretations = interpretations;
  return DesignIRSchema.parse(ir);
}

/** The interpretations a person has to confirm before building on them. */
export function uncertain(ir: DesignIR): Interpretation[] {
  return (ir.meta.interpretations ?? []).filter((i) => i.escalation !== "accept");
}
