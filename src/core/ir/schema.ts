// Design IR — canonical, versioned, Zod-validated (decisions #22, #40).
// Every element carries a stable `id` (graph projection + mapping rebind).
// Enum/discrete fields are what System One normalizes with confidence at intake.

import { z } from "zod";

export const InputRef = z.object({
  kind: z.enum(["text", "screenshot", "code", "asset"]),
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
  src: z.string(),
  sizeBytes: z.number().optional(),
  dims: z.tuple([z.number(), z.number()]).optional(),
  budgetBytes: z.number().optional(),
});

export const DesignIRSchema = z.object({
  version: z.string(),
  meta: z.object({
    projectName: z.string(),
    createdAt: z.string(),
    sourceInputs: z.array(InputRef).default([]),
    /** Design guide slug (design-guide/<style>.md) the build should follow. */
    style: z.string().optional(),
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
  // Every element id -> the input(s) that produced it (provenance / responsible-AI).
  provenance: z.record(z.array(InputRef)).default({}),
});

export type DesignIR = z.infer<typeof DesignIRSchema>;
