// Reads a design guide (design-guide/<slug>.md) into something the engine can use:
// tokens for the scaffold, a brief for the agent's context pack, and the checks the
// built page will be judged against.
//
// ponytail: a small YAML-subset parser rather than a dependency. It handles exactly
// what the guides use — nested maps, block lists, inline objects and arrays, quoted
// scalars. style.check.ts parses all 91 guides, so the corpus is the test.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

export const GUIDE_DIR = fileURLToPath(new URL("../../../design-guide", import.meta.url));

export interface StyleCheck {
  id: string;
  rule: string;
  kind: "deterministic" | "judged";
  applies_to?: string[];
}

export interface StyleGuide {
  slug: string;
  title: string;
  summary: string;
  bestFor: string[];
  avoidFor: string[];
  tokens: Record<string, unknown>;
  checks: StyleCheck[];
  variants?: Array<Record<string, unknown>>;
  dos: string[];
  donts: string[];
}

// ── YAML subset ───────────────────────────────────────────
interface Line {
  indent: number;
  text: string;
}

function toLines(src: string): Line[] {
  return src
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => ({ indent: /^ */.exec(l)![0].length, text: l.trim() }));
}

/** Split on commas at bracket depth 0, leaving quoted spans alone. */
function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let cur = "";
  for (const ch of s) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === "{" || ch === "[") depth++;
    if (ch === "}" || ch === "]") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

function parseScalar(raw: string): unknown {
  const s = raw.trim();
  if (!s) return "";
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

function parseValue(raw: string): unknown {
  const s = raw.trim();
  if (s.startsWith("{") && s.endsWith("}")) {
    const obj: Record<string, unknown> = {};
    for (const part of splitTop(s.slice(1, -1))) {
      const i = part.indexOf(":");
      if (i === -1) continue;
      obj[part.slice(0, i).trim()] = parseValue(part.slice(i + 1));
    }
    return obj;
  }
  if (s.startsWith("[") && s.endsWith("]")) {
    return splitTop(s.slice(1, -1)).map(parseValue);
  }
  return parseScalar(s);
}

function parseNode(ls: Line[], start: number, indent: number): [unknown, number] {
  let i = start;
  if (ls[i]?.text.startsWith("- ")) {
    const arr: unknown[] = [];
    while (i < ls.length && ls[i]!.indent === indent && ls[i]!.text.startsWith("- ")) {
      const rest = ls[i]!.text.slice(2).trim();
      // A block list of maps: "- key: value" followed by deeper sibling keys.
      // Anything quoted or bracketed is a plain value, not a key.
      if (/^[A-Za-z_][\w.-]*\s*:/.test(rest)) {
        const item: Line[] = [{ indent: indent + 2, text: rest }];
        i++;
        while (i < ls.length && ls[i]!.indent > indent) {
          item.push(ls[i]!);
          i++;
        }
        arr.push(parseNode(item, 0, indent + 2)[0]);
      } else {
        arr.push(parseValue(rest));
        i++;
      }
    }
    return [arr, i];
  }
  const obj: Record<string, unknown> = {};
  while (i < ls.length && ls[i]!.indent === indent) {
    const text = ls[i]!.text;
    const colon = text.indexOf(":");
    if (colon === -1) {
      i++;
      continue;
    }
    const key = text.slice(0, colon).trim();
    const inline = text.slice(colon + 1).trim();
    if (inline) {
      obj[key] = parseValue(inline);
      i++;
    } else if (i + 1 < ls.length && ls[i + 1]!.indent > indent) {
      const [value, next] = parseNode(ls, i + 1, ls[i + 1]!.indent);
      obj[key] = value;
      i = next;
    } else {
      obj[key] = null;
      i++;
    }
  }
  return [obj, i];
}

export function parseFrontmatter(src: string): Record<string, unknown> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(src);
  if (!match) throw new Error("no frontmatter block");
  const [value] = parseNode(toLines(match[1]!), 0, 0);
  return value as Record<string, unknown>;
}

// ── Guide loading ─────────────────────────────────────────
function bullets(body: string, heading: string): string[] {
  const section = new RegExp(`^## ${heading}\\s*$([\\s\\S]*?)(?=^## |\\Z)`, "m").exec(body);
  if (!section) return [];
  return section[1]!
    .split(/\r?\n/)
    .filter((l) => l.trim().startsWith("- "))
    .map((l) => l.trim().slice(2).trim());
}

export function loadStyle(slug: string, dir: string = GUIDE_DIR): StyleGuide {
  const path = join(dir, `${slug}.md`);
  if (!existsSync(path)) {
    throw new Error(`unknown style '${slug}' — expected ${path}. See design-guide/styles.json.`);
  }
  const src = readFileSync(path, "utf8");
  const fm = parseFrontmatter(src);
  const body = src.slice(src.indexOf("\n---", 3) + 4);
  const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

  return {
    slug: String(fm["slug"] ?? slug),
    title: String(fm["title"] ?? slug),
    summary: String(fm["summary"] ?? ""),
    bestFor: asList(fm["best_for"]),
    avoidFor: asList(fm["avoid_for"]),
    tokens: (fm["tokens"] as Record<string, unknown>) ?? {},
    checks: Array.isArray(fm["checks"]) ? (fm["checks"] as StyleCheck[]) : [],
    variants: Array.isArray(fm["variants"]) ? (fm["variants"] as Array<Record<string, unknown>>) : undefined,
    dos: bullets(body, "Do"),
    donts: bullets(body, "Don't"),
  };
}

export function listStyles(dir: string = GUIDE_DIR): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_") && f !== "README.md")
    .map((f) => f.replace(/\.md$/, ""))
    .sort();
}

// ── Consumers ─────────────────────────────────────────────
function flatten(prefix: string, value: unknown, out: Array<[string, string]>): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    // Token lists are mostly {name, value} pairs — palettes, gradients, surfaces.
    const named = value.filter(
      (v): v is { name: string; value: string } =>
        typeof v === "object" && v !== null && "name" in v && "value" in v,
    );
    if (named.length) {
      for (const n of named) out.push([`${prefix}-${n.name}`, String(n.value)]);
    } else {
      out.push([prefix, value.map(String).join(", ")]);
    }
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value)) flatten(prefix ? `${prefix}-${k}` : k, v, out);
    return;
  }
  out.push([prefix, String(value)]);
}

/** Style tokens as CSS custom properties, written into the scaffold for agents to use. */
export function styleTokensCss(style: StyleGuide): string {
  const pairs: Array<[string, string]> = [];
  flatten("", style.tokens, pairs);
  const body = pairs
    .map(([k, v]) => `  --${k.replace(/^-+/, "").replace(/[^a-zA-Z0-9-]/g, "-")}: ${v};`)
    .join("\n");
  return `/* ${style.title} — generated from design-guide/${style.slug}.md. Do not edit by hand. */\n:root {\n${body}\n}\n`;
}

/** A compact description of the style for an agent's context pack. */
export function styleBrief(style: StyleGuide): string {
  const tokenLines: Array<[string, string]> = [];
  flatten("", style.tokens, tokenLines);
  const checks = style.checks.map((c) => `- ${c.id}: ${c.rule}`);
  return [
    `Design style: ${style.title} (${style.slug})`,
    style.summary,
    "",
    "Tokens (also available as CSS variables in styles/tokens.css):",
    ...tokenLines.map(([k, v]) => `  ${k.replace(/^-+/, "")}: ${v}`),
    "",
    style.dos.length ? `Do:\n${style.dos.map((d) => `  - ${d}`).join("\n")}` : "",
    style.donts.length ? `Don't:\n${style.donts.map((d) => `  - ${d}`).join("\n")}` : "",
    "",
    "The built page will be checked against these rules:",
    ...checks,
  ]
    .filter(Boolean)
    .join("\n");
}
