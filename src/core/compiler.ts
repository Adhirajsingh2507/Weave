// Phase 1/6 — Design Compiler intake (deterministic minimal; LLM interpreter is the
// documented upgrade). Accepts a partial IR object, or a simple line-directive brief:
//   style: tactical-hud          (a slug from design-guide/styles.json)
//   packs: web-security seo      (policy packs; defaults apply when omitted)
//   page: home /
//   component: hero section
//   asset: robot 3d robot.glb in:hero budget:1.5mb tris:80k

import { DesignIRSchema } from "./ir/schema.js";
import { loadStyle } from "./design/style.js";
import type { DesignIR } from "./ir/schema.js";

export interface BriefInput {
  projectName?: string;
  /** A partial/complete IR object (parsed + defaulted). Takes precedence over `text`. */
  ir?: unknown;
  /** Line-directive brief (see header). */
  text?: string;
  /** Design guide slug used when the brief names no style. */
  defaultStyle?: string;
  /** Policy packs used when the brief names none; [] disables packs entirely. */
  defaultPacks?: string[];
}

/** "300kb", "1.5mb", "2048" → bytes. */
function parseSize(s: string): number {
  const m = /^([\d.]+)\s*(kb|mb|b)?$/i.exec(s.trim());
  if (!m) throw new Error(`asset budget '${s}' is not a size (e.g. 300kb, 1.5mb)`);
  const n = Number(m[1]);
  const unit = (m[2] ?? "b").toLowerCase();
  return Math.round(unit === "mb" ? n * 1024 * 1024 : unit === "kb" ? n * 1024 : n);
}

/** "80k", "120000" → a count. */
function parseCount(s: string): number {
  const m = /^([\d.]+)(k)?$/i.exec(s.trim());
  if (!m) throw new Error(`triangle budget '${s}' is not a count (e.g. 80k)`);
  return Math.round(Number(m[1]) * (m[2] ? 1000 : 1));
}

function cap(s: string): string {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}

export function compileBrief(input: BriefInput): DesignIR {
  if (input.ir) return DesignIRSchema.parse(input.ir);

  const pages: Array<{ id: string; name: string; route: string; sections: string[] }> = [];
  const components: Array<{ id: string; name: string; kind: string }> = [];
  const assets: Array<{ id: string; type: string; src: string; placement?: string; budgetBytes?: number; budgetTriangles?: number }> = [];
  let style = input.defaultStyle;
  let packs: string[] | undefined = input.defaultPacks;

  for (const raw of (input.text ?? "").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [kind, ...rest] = line.split(/\s+/);
    if (kind === "style:" && rest[0]) {
      style = rest[0];
    } else if (kind === "packs:" && rest.length) {
      packs = rest;
    } else if (kind === "page:" && rest[0]) {
      pages.push({ id: rest[0], name: cap(rest[0]), route: rest[1] ?? `/${rest[0]}`, sections: rest.slice(2) });
    } else if (kind === "component:" && rest[0]) {
      components.push({ id: rest[0], name: cap(rest[0]), kind: rest[1] ?? "section" });
    } else if (kind === "asset:" && rest[0]) {
      // Positional id, type, src; then optional key:value options in any order.
      const opts = Object.fromEntries(rest.slice(3).map((o) => o.split(":") as [string, string]).filter(([, v]) => v));
      assets.push({
        id: rest[0],
        type: rest[1] ?? "image",
        src: rest[2] ?? rest[0],
        ...(opts["in"] ? { placement: opts["in"] } : {}),
        ...(opts["budget"] ? { budgetBytes: parseSize(opts["budget"]) } : {}),
        ...(opts["tris"] ? { budgetTriangles: parseCount(opts["tris"]) } : {}),
      });
    }
  }

  return DesignIRSchema.parse({
    version: "1",
    meta: {
      projectName: input.projectName ?? "project",
      createdAt: new Date().toISOString(),
      ...(style ? { style } : {}),
      ...(packs ? { packs } : {}),
    },
    // The IR carries the guide's tokens, not just its name, so the design is complete in one
    // canonical document. An unknown slug throws here — at intake, not half way through a run.
    ...(style ? { designTokens: loadStyle(style).tokens } : {}),
    visualLanguage: { mood: "clean" },
    pages,
    components,
    assets,
  });
}
