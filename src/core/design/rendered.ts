// D3 — style checks run on the rendered page. A snapshot of computed styles is taken in the
// browser once; runners, each matched to a family of check phrasings, judge it. A check whose rule
// no runner recognises stays `pending`, and the coverage number counts only the recognised ones.
//
// ponytail: matching is by phrasing, not by a per-check id table — one runner covers every guide
// that words a rule the same way. A rule phrased differently is simply not covered, never guessed.

import { contrast, parseColor } from "./theme.js";
import type { StyleCheck, StyleGuide } from "./style.js";

/** What the page looks like, computed in the browser. */
export interface PageSnapshot {
  bodyBg: string;
  elements: Array<{
    tag: string;
    card: boolean;
    interactive: boolean;
    heading: boolean;
    radius: number;
    shadow: string;
    backgroundImage: string;
    transitionMs: number[];
    animation: string;
    rotateDeg: number;
    textTransform: string;
    color: string;
    effectiveBg: string;
    overImage: boolean;
    fontSizePx: number;
    fontWeight: number;
    borderPx: number;
    hasText: boolean;
  }>;
  fontFiles: string[];
  bytes: number;
}

export type RenderedStatus = "pass" | "fail" | "unavailable";
export interface RenderedResult {
  status: RenderedStatus;
  detail: string;
}

/** The in-page measurement, as a string: this build has no DOM types, and it runs in the browser. */
export const SNAPSHOT_SCRIPT = `(() => {
  const opaque = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      const m = /rgba?\\(([^)]+)\\)/.exec(c);
      if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); if (p.length < 4 || p[3] > 0.5) return c; }
    }
    return "rgb(255, 255, 255)";
  };
  // Text whose backdrop includes an image or gradient cannot be judged from computed colours.
  const overImage = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage !== "none") return true;
      const m = /rgba?\\(([^)]+)\\)/.exec(s.backgroundColor);
      if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); if (p.length < 4 || p[3] > 0.5) return false; }
    }
    return false;
  };
  const ms = (v) => v.split(",").map((x) => x.trim()).map((x) => x.endsWith("ms") ? parseFloat(x) : parseFloat(x) * 1000);
  const rotation = (t) => {
    const m = /matrix\\(([^)]+)\\)/.exec(t);
    if (!m) return 0;
    const [a, b] = m[1].split(",").map(Number);
    return Math.round(Math.atan2(b, a) * 180 / Math.PI);
  };
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    if (["SCRIPT", "STYLE", "LINK", "META", "TITLE", "HEAD", "NOSCRIPT", "TEMPLATE"].includes(el.tagName)) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none") continue;
    const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    out.push({
      tag: el.tagName.toLowerCase(),
      card: el.matches("article, .card"),
      interactive: el.matches("a, button, .button, input, select, textarea, [role=button]"),
      heading: /^H[1-3]$/.test(el.tagName),
      radius: Math.max(...["TopLeft", "TopRight", "BottomLeft", "BottomRight"].map((k) => parseFloat(s["border" + k + "Radius"]) || 0)),
      shadow: s.boxShadow,
      backgroundImage: s.backgroundImage,
      transitionMs: ms(s.transitionDuration).filter((x) => x > 0),
      animation: s.animationName,
      rotateDeg: rotation(s.transform),
      textTransform: s.textTransform,
      color: s.color,
      effectiveBg: opaque(el),
      overImage: text && overImage(el),
      fontSizePx: parseFloat(s.fontSize),
      fontWeight: Number(s.fontWeight) || 400,
      borderPx: Math.max(...["Top", "Right", "Bottom", "Left"].map((k) => s["border" + k + "Style"] === "none" ? 0 : parseFloat(s["border" + k + "Width"]) || 0)),
      hasText: text,
    });
  }
  const entries = performance.getEntriesByType("resource");
  const nav = performance.getEntriesByType("navigation")[0];
  return {
    bodyBg: getComputedStyle(document.body).backgroundColor,
    elements: out,
    fontFiles: entries.filter((e) => /\\.(woff2?|ttf|otf|eot)(\\?|$)/i.test(e.name) || e.initiatorType === "css" && /font/i.test(e.name)).map((e) => e.name),
    bytes: [nav, ...entries].reduce((n, e) => n + (e ? (e.transferSize || e.encodedBodySize || 0) : 0), 0),
  };
})()`;

interface Runner {
  id: string;
  match: RegExp;
  /** Does a pass here prove the whole rule? Default: nothing substantive is left once the match is removed. */
  full?(rule: string, m: RegExpMatchArray): boolean;
  run(m: RegExpMatchArray, snap: PageSnapshot, style?: StyleGuide): RenderedResult;
}

const FILLER = new Set(["every", "all", "the", "a", "an", "is", "are", "any", "anywhere", "on", "page", "across", "computed", "only", "and", "of", "css", "declared", "flat", "colour", "color", "everywhere", "used", "are declared"]);
/** Nothing but filler left once the matched phrase is removed. */
function residueFree(rule: string, m: RegExpMatchArray): boolean {
  const rest = rule.replace(m[0], " ").toLowerCase().match(/[a-z0-9#.:%-]+/g) ?? [];
  return rest.every((w) => FILLER.has(w));
}

const pass = (detail: string): RenderedResult => ({ status: "pass", detail });
const fail = (detail: string): RenderedResult => ({ status: "fail", detail });
const none = (detail: string): RenderedResult => ({ status: "unavailable", detail });
const list = (xs: string[]): string => [...new Set(xs)].slice(0, 4).join(", ");
const rgbOf = (c: string): [number, number, number] | undefined => parseColor(c);

export const RUNNERS: Runner[] = [
  {
    id: "radius-zero",
    match: /(every (computed )?border-radius is 0(px)?|border-radius is 0px|corners are (square|sharp)|no rounded (corners|shapes))/i,
    run(_m, s) {
      const round = s.elements.filter((e) => e.radius > 0);
      return round.length ? fail(`${round.length} element(s) rounded: ${list(round.map((e) => `${e.tag} ${e.radius}px`))}`) : pass("every radius is 0px");
    },
  },
  {
    id: "radius-range",
    match: /radi(?:us|i)\b[^.]*?(\d+)\s*(?:-|–|to)\s*(\d+)\s*px/i,
    run(m, s) {
      const [lo, hi] = [Number(m[1]), Number(m[2])];
      const targets = s.elements.filter((e) => e.card || e.tag === "button");
      if (!targets.length) return none("no card or button on the page to measure");
      const off = targets.filter((e) => e.radius < lo || e.radius > hi);
      return off.length ? fail(`radius outside ${lo}-${hi}px: ${list(off.map((e) => `${e.tag} ${e.radius}px`))}`) : pass(`card and button radii within ${lo}-${hi}px`);
    },
  },
  {
    id: "no-shadow",
    match: /\bno (box-|drop )?shadows?\b/i,
    run(_m, s) {
      const shadowed = s.elements.filter((e) => e.shadow && e.shadow !== "none");
      return shadowed.length ? fail(`${shadowed.length} element(s) with a shadow: ${list(shadowed.map((e) => e.tag))}`) : pass("no box-shadow on the page");
    },
  },
  {
    id: "no-gradient",
    match: /\bno gradients?\b/i,
    run(_m, s) {
      const g = s.elements.filter((e) => /gradient\(/.test(e.backgroundImage));
      return g.length ? fail(`${g.length} gradient(s): ${list(g.map((e) => e.tag))}`) : pass("flat colour only");
    },
  },
  {
    id: "no-motion",
    match: /\bno (css )?transitions?( or animations?)?\b|no transitions, no|\bmotion is (none|zero)\b/i,
    run(_m, s) {
      const moving = s.elements.filter((e) => e.transitionMs.length || (e.animation && e.animation !== "none"));
      return moving.length ? fail(`${moving.length} element(s) animate: ${list(moving.map((e) => e.tag))}`) : pass("no transitions or animations declared");
    },
  },
  {
    id: "duration-range",
    match: /(?:transitions?|durations?|animations?|motion)[^.]*?(\d{2,4})\s*(?:-|–|to)\s*(\d{2,4})\s*ms/i,
    run(m, s) {
      const [lo, hi] = [Number(m[1]), Number(m[2])];
      const ds = s.elements.flatMap((e) => e.transitionMs);
      if (!ds.length) return none("nothing on the page transitions");
      const off = ds.filter((d) => d < lo || d > hi);
      return off.length ? fail(`durations outside ${lo}-${hi}ms: ${list(off.map((d) => `${d}ms`))}`) : pass(`every transition within ${lo}-${hi}ms`);
    },
  },
  {
    id: "system-fonts",
    match: /no webfonts?|no web fonts?|only system font|system fonts? only/i,
    run(_m, s) {
      return s.fontFiles.length ? fail(`font files loaded: ${list(s.fontFiles)}`) : pass("no font files requested");
    },
  },
  {
    id: "contrast",
    match: /(?:meets?|≥|>=)\s*4\.5:1/,
    // Every text element on the page is checked, so any "X on Y meets 4.5:1" clause is covered —
    // unless the rule also asks about text over imagery, texture or pixels, or adds a second clause.
    full: (rule) => !rule.includes(";") && !/image|gradient|pixel|texture|grain|overlay|shadow|video|photo|art|fallback|halation|glow|behind|render|backdrop|translucent|glass|gloss|bloom|brightest|darkest|region|environment|never below|\d+px/i.test(rule),
    run(_m, s) {
      const text = s.elements.filter((e) => e.hasText);
      if (!text.length) return none("no text on the page");
      const low: string[] = [];
      let unmeasured = 0;
      for (const e of text) {
        if (e.overImage) {
          unmeasured++;
          continue;
        }
        const [fg, bg] = [rgbOf(e.color), rgbOf(e.effectiveBg)];
        if (!fg || !bg) continue;
        const large = e.fontSizePx >= 24 || (e.fontSizePx >= 18.66 && e.fontWeight >= 700);
        const ratio = contrast(fg, bg);
        if (ratio < (large ? 3 : 4.5)) low.push(`${e.tag} ${ratio.toFixed(2)}:1`);
      }
      if (low.length) return fail(`${low.length} text element(s) under WCAG AA: ${list(low)}`);
      if (unmeasured) return none(`${text.length - unmeasured} text element(s) pass; ${unmeasured} sit over an image or gradient and need a pixel check`);
      return pass(`all ${text.length} text elements meet WCAG AA contrast`);
    },
  },
  {
    id: "uppercase-headings",
    match: /(display )?headings? (are|is) (set in )?uppercase/i,
    run(_m, s) {
      const hs = s.elements.filter((e) => e.heading);
      if (!hs.length) return none("no headings");
      const lower = hs.filter((e) => e.textTransform !== "uppercase");
      return lower.length ? fail(`${lower.length} heading(s) not uppercase`) : pass("headings are uppercase");
    },
  },
  {
    id: "no-uppercase-headings",
    match: /no uppercase headings/i,
    run(_m, s) {
      const up = s.elements.filter((e) => e.heading && e.textTransform === "uppercase");
      return up.length ? fail(`${up.length} uppercase heading(s)`) : pass("no uppercase headings");
    },
  },
  {
    id: "border-width",
    // Width is measured; the colour or material a rule names ("ink", "translucent") is not.
    full: () => false,
    match: /(?:interactive|surfaces?|cards?|buttons?)[^.]*?\b(\d)px\b[^.]*?border|\b(\d)px (?:ink |solid |black )?borders?\b/i,
    run(m, s) {
      const want = Number(m[1] ?? m[2]);
      const targets = s.elements.filter((e) => e.card || e.tag === "button" || e.tag === "input");
      if (!targets.length) return none("no card, button or input on the page");
      const off = targets.filter((e) => e.borderPx !== want);
      return off.length ? fail(`border not ${want}px: ${list(off.map((e) => `${e.tag} ${e.borderPx}px`))}`) : pass(`cards and controls carry a ${want}px border`);
    },
  },
  {
    id: "page-weight",
    match: /(?:total )?page weight[^.]*?under (\d+)\s*(kb|mb)/i,
    run(m, s) {
      const limit = Number(m[1]) * (m[2]!.toLowerCase() === "mb" ? 1024 * 1024 : 1024);
      return s.bytes <= limit ? pass(`${Math.round(s.bytes / 1024)} KB transferred`) : fail(`${Math.round(s.bytes / 1024)} KB transferred, over ${m[1]}${m[2]}`);
    },
  },
  {
    id: "palette-limit",
    match: /no more than (\d+) distinct colou?rs/i,
    run(m, s) {
      const colours = new Set(s.elements.flatMap((e) => [e.color, e.effectiveBg]));
      const max = Number(m[1]);
      return colours.size <= max ? pass(`${colours.size} distinct colours painted`) : fail(`${colours.size} distinct colours painted, over ${max}`);
    },
  },
  {
    id: "no-rotation",
    match: /no rotation transforms?|no rotated elements/i,
    run(_m, s) {
      const r = s.elements.filter((e) => e.rotateDeg !== 0);
      return r.length ? fail(`${r.length} rotated element(s)`) : pass("nothing is rotated");
    },
  },
  {
    id: "background-token",
    match: /(?:page )?background is the ([a-z-]+) token/i,
    run(m, s, style) {
      const palette = ((style?.tokens["colors"] as { palette?: Array<{ name: string; value: string }> })?.palette ?? []);
      const token = palette.find((p) => p.name === m[1]);
      const [want, got] = [token && parseColor(token.value), parseColor(s.bodyBg)];
      if (!want || !got) return none(`no "${m[1]}" colour to compare`);
      return want.every((c, i) => Math.abs(c - got[i]!) <= 2) ? pass(`background is ${token!.value}`) : fail(`background is ${s.bodyBg}, not the ${m[1]} token ${token!.value}`);
    },
  },
];

/** The runner for a check, if its rule is phrased the way one recognises. Judged checks have none. */
export function renderedRunnerFor(check: StyleCheck): { runner: Runner; match: RegExpMatchArray; full: boolean } | undefined {
  if (check.kind === "judged") return undefined;
  for (const runner of RUNNERS) {
    const match = check.rule.match(runner.match);
    if (match) return { runner, match, full: runner.full ? runner.full(check.rule, match) : residueFree(check.rule, match) };
  }
  return undefined;
}

/**
 * Judge one check against a snapshot. Undefined when no runner covers it. A failure is decisive
 * (one false clause breaks the rule); a pass counts only when the runner covers the whole rule —
 * otherwise it is `unavailable`, saying what was checked and what was not.
 */
export function runRenderedCheck(check: StyleCheck, snap: PageSnapshot, style?: StyleGuide): (RenderedResult & { runner: string }) | undefined {
  const found = renderedRunnerFor(check);
  if (!found) return undefined;
  const r = found.runner.run(found.match, snap, style);
  if (r.status === "pass" && !found.full) {
    return { status: "unavailable", detail: `checked "${found.match[0]}": ${r.detail}; the rest of the rule is not measured`, runner: found.runner.id };
  }
  return { ...r, runner: found.runner.id };
}

/** How many checks a runner can fail, and how many it can also pass (the whole rule covered). */
export function renderedCoverage(checks: StyleCheck[]): { deterministic: number; covered: number; full: number } {
  const det = checks.filter((c) => c.kind === "deterministic");
  const found = det.map(renderedRunnerFor).filter((f) => f !== undefined);
  return { deterministic: det.length, covered: found.length, full: found.filter((f) => f.full).length };
}
