// D3 — a guide's tokens applied to plain markup, so the same page looks like its style before any
// agent touches it: surfaces, colours, type families and scale, spacing, radius, borders, motion.
// tokens.css only declares variables; theme.css is what uses them.
//
// Palettes name their colours freely (22 of 91 have a "background"), so roles are resolved by
// name first and by luminance second, and text contrast is enforced here, not hoped for: a theme
// never ships body text or a button label under 4.5:1.
//
// ponytail: font stacks are used as written, with no webfonts bundled — a page shows the first
// installed family, else the generic fallback. Bundling licensed fonts per style is the upgrade.

import type { StyleGuide } from "./style.js";

type Rgb = [number, number, number];
interface Swatch {
  name: string;
  value: string;
  rgb: Rgb;
}

/** #rgb, #rrggbb, #rrggbbaa, rgb(), rgba() → [r,g,b]. Anything else (gradients, names) → undefined. */
export function parseColor(v: string): Rgb | undefined {
  const s = v.trim();
  let m = /^#([0-9a-f]{3})$/i.exec(s);
  if (m) return [...m[1]!].map((c) => parseInt(c + c, 16)) as Rgb;
  m = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/i.exec(s);
  if (m) return [0, 2, 4].map((i) => parseInt(m![1]!.slice(i, i + 2), 16)) as Rgb;
  m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(s);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return undefined;
}

/** WCAG relative luminance. */
export function luminance([r, g, b]: Rgb): number {
  const lin = (c: number): number => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: Rgb, b: Rgb): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

const saturation = ([r, g, b]: Rgb): number => {
  const [max, min] = [Math.max(r, g, b), Math.min(r, g, b)];
  return max === 0 ? 0 : (max - min) / max;
};

const BG = ["background", "bg", "paper", "base", "canvas", "page", "ground", "void", "night", "terminal-bg", "dark-ground", "parchment", "cream", "bone", "newsprint", "washi", "sheet", "stock", "wall", "noir", "crt", "haze-base"];
const FG = ["ink", "foreground", "text", "on-surface", "dark-foreground", "near-black", "sumi", "ink-black", "charcoal", "graphite"];
const ACCENT = ["accent", "primary", "brand", "signal", "highlight", "pop", "hot", "spot", "accent-a", "loud", "neon-magenta", "electric-blue", "hot-pink", "phosphor", "gold", "red"];
const SURFACE = ["surface", "panel", "surface-raised", "elevated", "card", "shell", "tile", "glass", "surface-variant", "paper-2"];
const MUTED = ["muted", "dim", "grey", "stone", "grey-500", "line-dim"];

export interface ThemeRoles {
  mode: "light" | "dark";
  bg: string;
  fg: string;
  accent: string;
  onAccent: string;
  surface: string;
  muted: string;
  line: string;
  /** Link colour: the guide's own "link" when named, else the accent if readable, else the text. */
  link: string;
  visited?: string;
}

/** Background, text, accent, surface and muted colours for a guide, with readable text guaranteed. */
export function resolveRoles(style: StyleGuide): ThemeRoles {
  const colors = (style.tokens["colors"] ?? {}) as { mode?: string; palette?: Array<{ name: string; value: string }> };
  const mode: "light" | "dark" = colors.mode === "dark" ? "dark" : "light";
  const swatches: Swatch[] = (colors.palette ?? []).flatMap((p) => {
    const rgb = parseColor(String(p.value));
    // Roles are opaque hex: an rgba() token keeps its hue, and its alpha is not the theme's to use.
    return rgb ? [{ name: String(p.name), value: `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`.toUpperCase(), rgb }] : [];
  });
  const named = (names: string[], ok: (s: Swatch) => boolean = () => true): Swatch | undefined => {
    for (const n of names) {
      const s = swatches.find((x) => x.name === n && ok(x));
      if (s) return s;
    }
    return undefined;
  };
  const fits = (s: Swatch): boolean => (mode === "dark" ? luminance(s.rgb) < 0.2 : luminance(s.rgb) > 0.45);
  const byLum = [...swatches].sort((a, b) => luminance(a.rgb) - luminance(b.rgb));
  const fallbackBg: Swatch = { name: "bg", value: mode === "dark" ? "#0B0B0C" : "#FFFFFF", rgb: mode === "dark" ? [11, 11, 12] : [255, 255, 255] };
  const bg = named(BG, fits) ?? (mode === "dark" ? byLum[0] : byLum.at(-1)) ?? fallbackBg;
  const rest = swatches.filter((s) => s !== bg);

  const readable = (s: Swatch | undefined): s is Swatch => !!s && contrast(s.rgb, bg.rgb) >= 4.5;
  const best = [...rest].sort((a, b) => contrast(b.rgb, bg.rgb) - contrast(a.rgb, bg.rgb))[0];
  const bw: Swatch = luminance(bg.rgb) > 0.18 ? { name: "black", value: "#000000", rgb: [0, 0, 0] } : { name: "white", value: "#FFFFFF", rgb: [255, 255, 255] };
  const namedFg = named(FG);
  const fg = readable(namedFg) ? namedFg : readable(best) ? best : bw;

  const namedAccent = named(ACCENT, (s) => s !== fg);
  const vivid = rest.filter((s) => s !== fg).sort((a, b) => saturation(b.rgb) - saturation(a.rgb))[0];
  const accent = namedAccent ?? vivid ?? fg;
  const onAccent = [fg, bg, { rgb: [0, 0, 0] as Rgb, value: "#000000" }, { rgb: [255, 255, 255] as Rgb, value: "#FFFFFF" }]
    .sort((a, b) => contrast(b.rgb, accent.rgb) - contrast(a.rgb, accent.rgb))[0]!.value;

  const near = rest.filter((s) => s !== fg && s !== accent).sort((a, b) => Math.abs(luminance(a.rgb) - luminance(bg.rgb)) - Math.abs(luminance(b.rgb) - luminance(bg.rgb)))[0];
  const surfaceNamed = named(SURFACE, (s) => s !== fg && contrast(fg.rgb, s.rgb) >= 4.5);
  const surface = surfaceNamed ?? (near && contrast(fg.rgb, near.rgb) >= 4.5 ? near : bg);
  const mutedNamed = named(MUTED, (s) => contrast(s.rgb, bg.rgb) >= 4.5);
  const line = named(["hairline", "line", "rule", "grid-line", "border", "outline"]) ?? named(MUTED) ?? fg;

  const link = named(["link"], readable) ?? (readable(accent) ? accent : fg);
  const visited = named(["visited"], readable);
  return {
    mode,
    bg: bg.value,
    fg: fg.value,
    accent: accent.value,
    onAccent,
    surface: surface.value,
    muted: (mutedNamed ?? fg).value,
    line: line.value,
    link: link.value,
    ...(visited ? { visited: visited.value } : {}),
  };
}

const GENERIC = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded", "emoji", "math", "fangsong"]);
/**
 * A font stack as valid CSS: every family name quoted. Unquoted, a name like "Source Serif 4" is
 * not a CSS identifier, and the browser drops the whole declaration (found by the 91-style render).
 */
export function cssFontStack(stack: string): string {
  return stack
    .split(",")
    .map((f) => f.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
    .map((f) => (GENERIC.has(f.toLowerCase()) ? f : `"${f}"`))
    .join(", ");
}

const num = (v: unknown, d: number): number => (typeof v === "number" && Number.isFinite(v) ? v : d);
const H1: Record<string, string> = {
  compact: "2rem",
  default: "2.5rem",
  large: "3.25rem",
  display: "clamp(3rem, 7vw, 6rem)",
};

/** The guide applied to the template's markup. Deterministic: same guide, same CSS. */
export function styleThemeCss(style: StyleGuide): string {
  const t = style.tokens as Record<string, Record<string, unknown>>;
  const r = resolveRoles(style);
  const typo = t["typography"] ?? {};
  const layout = t["layout"] ?? {};
  const shape = t["shape"] ?? {};
  const motion = t["motion"] ?? {};
  const families = (Array.isArray(typo["families"]) ? typo["families"] : []) as Array<{ role: string; family: string }>;
  const fam = (roles: string[]): string | undefined => roles.map((role) => families.find((f) => f.role === role)?.family).find(Boolean);
  const body = fam(["sans", "serif", "system", "grotesque", "technical", "mono"]) ?? families[0]?.family ?? "system-ui, sans-serif";
  const heading = fam(["display", "hand", "grotesque", "serif", "sans"]) ?? body;
  const mono = fam(["mono", "bitmap"]) ?? "ui-monospace, monospace";
  const spacing = (Array.isArray(layout["section_spacing_px"]) ? layout["section_spacing_px"] : [24, 48, 96]).map((x) => num(x, 48));
  const [sm, md] = [spacing[0] ?? 24, spacing[1] ?? spacing[0] ?? 48];
  const radius = num(shape["radius_px"], 0);
  const border = num(shape["border_px"], 1);
  const shadow = typeof shape["shadow"] === "string" && shape["shadow"] !== "none" ? shape["shadow"] : undefined;
  const duration = num(motion["duration_ms"], 0);
  const easing = typeof motion["easing"] === "string" && motion["easing"] !== "none" ? motion["easing"] : "ease";
  const props = (Array.isArray(motion["properties"]) ? motion["properties"] : []).map(String).filter((p) => /^[a-z-]+$/.test(p));
  const gradient = ((t["colors"]?.["gradients"] ?? []) as Array<{ value?: string }>).map((g) => String(g.value ?? "")).find((v) => /gradient\(/.test(v));
  const caseUpper = typo["heading_case"] === "uppercase";
  const measure = num(typo["measure_ch"], 70);

  const lines: string[] = [
    `/* ${style.title} — the guide's tokens applied to plain markup. Generated from design-guide/${style.slug}.md; do not edit. */`,
    ":root {",
    `  color-scheme: ${r.mode};`,
    `  --bg: ${r.bg};`,
    `  --fg: ${r.fg};`,
    `  --accent: ${r.accent};`,
    `  --on-accent: ${r.onAccent};`,
    `  --surface: ${r.surface};`,
    `  --muted: ${r.muted};`,
    `  --line: ${r.line};`,
    `  --font-body: ${cssFontStack(body)};`,
    `  --font-heading: ${cssFontStack(heading)};`,
    `  --font-mono: ${cssFontStack(mono)};`,
    `  --radius: ${radius}px;`,
    `  --border: ${border}px;`,
    `  --space-s: ${sm}px;`,
    `  --space-m: ${md}px;`,
    `  --max-width: ${num(layout["max_width_px"], 1120)}px;`,
    "}",
    `body { background-color: var(--bg);${gradient ? ` background-image: ${gradient}; background-repeat: no-repeat;` : ""} color: var(--fg); font-family: var(--font-body); font-size: ${num(typo["body_size_px"], 16)}px; line-height: ${num(typo["body_line_height"], 1.5)}; }`,
    "main { max-width: var(--max-width); margin-inline: auto; padding-inline: clamp(16px, 4vw, 32px); }",
    `h1, h2, h3 { font-family: var(--font-heading); line-height: ${num(typo["heading_line_height"], 1.15)}; letter-spacing: ${num(typo["heading_tracking_em"], 0)}em;${caseUpper ? " text-transform: uppercase;" : ""} }`,
    `h1 { font-size: ${H1[String(typo["scale"])] ?? H1["default"]}; margin-block: var(--space-s); }`,
    "h2 { font-size: 1.75rem; } h3 { font-size: 1.25rem; }",
    `p, li { max-width: ${measure}ch; }`,
    `a { color: ${r.link}; text-underline-offset: 0.15em; }`,
    ...(r.visited ? [`a:visited { color: ${r.visited}; }`] : []),
    "section { padding-block: var(--space-m); }",
    `article, .card { background: var(--surface); color: var(--fg); border: var(--border) solid var(--line); border-radius: var(--radius);${shadow ? ` box-shadow: ${shadow};` : ""} padding: var(--space-s); }`,
    `button, .button { background: var(--accent); color: var(--on-accent); border: var(--border) solid var(--accent); border-radius: var(--radius); padding: 0.75em 1.25em; font: inherit; min-height: 44px; cursor: pointer;${shadow ? ` box-shadow: ${shadow};` : ""} }`,
    "input, textarea, select { background: var(--surface); color: var(--fg); border: var(--border) solid var(--line); border-radius: var(--radius); padding: 0.6em 0.8em; font: inherit; min-height: 44px; }",
    "code, pre, kbd { font-family: var(--font-mono); }",
    "hr { border: 0; border-top: var(--border) solid var(--line); }",
    "img, video, model-viewer { border-radius: var(--radius); }",
  ];
  // Motion only where the guide has it: a zero-duration style declares no transitions at all.
  if (duration > 0 && props.length) {
    const list = props.map((p) => `${p} ${duration}ms ${easing}`).join(", ");
    lines.push(`a, button, .button, article, .card, input { transition: ${list}; }`);
  }
  return `${lines.join("\n")}\n`;
}
