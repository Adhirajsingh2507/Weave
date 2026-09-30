// Design IR — canonical, versioned, Zod-validated (decisions #22, #40).
// Every element carries a stable `id` (graph projection + mapping rebind).
// Enum/discrete fields are what decision layer normalizes with confidence at intake.

import { z } from "zod";

export const InputRef = z.object({
  // Extend, never rename: stored IRs keep parsing (V2.6 added "url").
  kind: z.enum(["text", "screenshot", "code", "asset", "url"]),
  ref: z.string(),
});

export const ColorToken = z.object({ name: z.string(), value: z.string() });
export const FontRef = z.object({
  family: z.string(),
  weights: z.array(z.number()).optional(),
});

export const Component = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.string(),
  role: z.string().optional(),
  variants: z.array(z.string()).optional(),
});

export const Page = z.object({
  id: z.string(),
  name: z.string(),
  route: z.string(),
  sections: z.array(z.string()).default([]),
});

export const Interaction = z.object({
  id: z.string(),
  trigger: z.string(),
  target: z.string(),
  behavior: z.string(),
});

export const Animation = z.object({
  id: z.string(),
  type: z.string(),
  target: z.string(),
  params: z.record(z.unknown()).optional(),
});

export const Asset = z.object({
  id: z.string(),
  type: z.enum(["3d", "image", "video", "logo", "font"]),
  /** Where the file comes from: a path in the repo, a path under an asset folder, or a URL. */
  src: z.string(),
  sizeBytes: z.number().optional(),
  dims: z.tuple([z.number(), z.number()]).optional(),
  /** Overrides the per-type default budget (V2.7). */
  budgetBytes: z.number().optional(),
  /** 3D only: a triangle budget, overriding the default. */
  budgetTriangles: z.number().optional(),
  /** The component that places this asset. Absent: any section may use it. */
  placement: z.string().optional(),
});

/**
 * The chosen design guide's tokens, under the guide's own key names (the guide is the spec,
 * decision #53). The core every guide carries is typed; the long tail — arch radii, scallops,
 * character grids — passes through untouched, so nothing a guide says is lost on the way to the
 * agent. Spacing lives under `layout` (section_spacing_px, gutter_px), where the guides put it.
 */
const Named = z.object({ name: z.string(), value: z.string() }).passthrough();
export const DesignTokens = z
  .object({
    colors: z
      .object({ mode: z.string(), palette: z.array(Named), gradients: z.array(Named).optional() })
      .passthrough(),
    typography: z
      .object({
        scale: z.string(),
        families: z.array(z.object({ role: z.string(), family: z.string(), weights: z.array(z.number()).optional() }).passthrough()),
        body_size_px: z.number(),
        body_line_height: z.number(),
        heading_tracking_em: z.number(),
        heading_line_height: z.number().optional(),
      })
      .passthrough(),
    layout: z
      .object({
        system: z.string(),
        density: z.string(),
        max_width_px: z.number(),
        // Pixels, or a CSS length where a guide means it: kinetic-typography's full-screen
        // sections are "100vh". The guide is the spec, so the IR accepts both.
        section_spacing_px: z.array(z.union([z.number(), z.string()])),
        columns: z.number().optional(),
        gutter_px: z.number().optional(),
      })
      .passthrough(),
    shape: z
      .object({ radius_px: z.number(), border_px: z.number(), shadow: z.string().optional(), border_style: z.string().optional() })
      .passthrough(),
    motion: z
      .object({ duration_ms: z.number(), easing: z.string(), intensity: z.string(), properties: z.array(z.string()) })
      .passthrough(),
    imagery: z.object({ treatment: z.array(z.string()), illustration: z.string(), icons: z.string() }).passthrough(),
  })
  .passthrough();
export type DesignTokens = z.infer<typeof DesignTokens>;

/** How one discrete field was read from a non-text input, and how sure the reading was (#24). */
export const Interpretation = z.object({
  field: z.string(),
  raw: z.string(),
  value: z.string(),
  confidence: z.number(),
  escalation: z.enum(["accept", "llm", "human"]),
  source: InputRef,
  /** Other values worth offering the reviewer, e.g. runner-up styles. */
  alternatives: z.array(z.string()).optional(),
});
export type Interpretation = z.infer<typeof Interpretation>;

export const DesignIRSchema = z.object({
  version: z.string(),
  meta: z.object({
    projectName: z.string(),
    createdAt: z.string(),
    sourceInputs: z.array(InputRef).default([]),
    /** Design guide slug (design-guide/<style>.md) the build should follow. */
    style: z.string().optional(),
    /** Policy packs to enforce; defaults applied at intake when the brief names none. */
    packs: z.array(z.string()).optional(),
    /** Fields read from screenshots or URLs, with confidence; uncertain ones gate at intake. */
    interpretations: z.array(Interpretation).optional(),
  }),
  visualLanguage: z.object({
    mood: z.string(),
    themes: z.array(z.enum(["light", "dark"])).default(["dark"]),
    keywords: z.array(z.string()).default([]),
  }),
  typography: z.object({
    scale: z.enum(["compact", "default", "large", "display"]).default("default"),
    families: z.array(FontRef).default([]),
  }).default({}),
  colors: z.object({
    mode: z.enum(["light", "dark", "both"]).default("both"),
    palette: z.array(ColorToken).default([]),
  }).default({}),
  layout: z.object({
    system: z.enum(["grid", "asymmetric", "centered", "split"]).default("grid"),
    density: z.enum(["compact", "comfortable", "spacious"]).default("comfortable"),
    breakpoints: z.array(z.number()).default([640, 768, 1024, 1280]),
  }).default({}),
  components: z.array(Component).default([]),
  pages: z.array(Page).default([]),
  interactions: z.array(Interaction).default([]),
  animations: z.array(Animation).default([]),
  assets: z.array(Asset).default([]),
  responsiveRules: z.array(z.string()).default([]),
  constraints: z.object({
    mobile: z.boolean().default(true),
    accessibility: z.enum(["A", "AA", "AAA"]).default("AA"),
    performance: z.record(z.unknown()).default({}),
    seo: z.boolean().default(true),
    technical: z
      .object({ stack: z.string().optional(), apis: z.array(z.string()).optional() })
      .default({}),
  }).default({}),
  /** The chosen guide's tokens (V2.6). Absent when no style is chosen. */
  designTokens: DesignTokens.optional(),
  // Every element id -> the input(s) that produced it (provenance / responsible-AI).
  provenance: z.record(z.array(InputRef)).default({}),
});

export type DesignIR = z.infer<typeof DesignIRSchema>;
