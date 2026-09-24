// Phase 1/6 — Design Compiler intake (deterministic minimal; LLM interpreter is the
// documented upgrade). Accepts a partial IR object, or a simple line-directive brief:
//   style: tactical-hud          (a slug from design-guide/styles.json)
//   page: home /
//   component: hero section
//   asset: robot 3d robot.glb

import { DesignIRSchema } from "./ir/schema.js";
import type { DesignIR } from "./ir/schema.js";

export interface BriefInput {
  projectName?: string;
  /** A partial/complete IR object (parsed + defaulted). Takes precedence over `text`. */
  ir?: unknown;
  /** Line-directive brief (see header). */
  text?: string;
  /** Design guide slug used when the brief names no style. */
  defaultStyle?: string;
}

function cap(s: string): string {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}

export function compileBrief(input: BriefInput): DesignIR {
  if (input.ir) return DesignIRSchema.parse(input.ir);

  const pages: Array<{ id: string; name: string; route: string; sections: string[] }> = [];
  const components: Array<{ id: string; name: string; kind: string }> = [];
  const assets: Array<{ id: string; type: string; src: string }> = [];
  let style = input.defaultStyle;

  for (const raw of (input.text ?? "").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [kind, ...rest] = line.split(/\s+/);
    if (kind === "style:" && rest[0]) {
      style = rest[0];
    } else if (kind === "page:" && rest[0]) {
      pages.push({ id: rest[0], name: cap(rest[0]), route: rest[1] ?? `/${rest[0]}`, sections: rest.slice(2) });
    } else if (kind === "component:" && rest[0]) {
      components.push({ id: rest[0], name: cap(rest[0]), kind: rest[1] ?? "section" });
    } else if (kind === "asset:" && rest[0]) {
      assets.push({ id: rest[0], type: rest[1] ?? "image", src: rest[2] ?? rest[0] });
    }
  }

  return DesignIRSchema.parse({
    version: "1",
    meta: {
      projectName: input.projectName ?? "project",
      createdAt: new Date().toISOString(),
      ...(style ? { style } : {}),
    },
    visualLanguage: { mood: "clean" },
    pages,
    components,
    assets,
  });
}
