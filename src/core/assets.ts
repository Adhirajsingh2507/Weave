// V2.7 — assets as first-class graph entities, not build tasks.
//
// An agent was once told to "build robot" for a .glb. Assets are acquired, optimised, measured
// and held to a budget by a deterministic step; agents only place them. Measurement parses file
// headers directly — PNG, JPEG, GIF, WebP and SVG dimensions, glTF-binary geometry — so it works
// offline with no image or 3D library installed.

import { createRequire } from "node:module";
import { WEAVE_ROOT, toolBin } from "./tools.js";
import { execFile } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, isAbsolute, join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export type AssetType = "3d" | "image" | "video" | "logo" | "font";

export interface AssetMeasure {
  sizeBytes: number;
  /** Width × height in pixels, for rasters and SVGs that declare them. */
  dims?: [number, number];
  /** glTF binary only. */
  triangles?: number;
  vertices?: number;
  meshes?: number;
  textures?: number;
  format: string;
}

export interface AssetBudget {
  maxBytes: number;
  maxTriangles?: number;
  /** The longer side, in pixels. */
  maxDimension?: number;
}

/** Defaults per type. A brief's budget:/tris: options override them. */
export const DEFAULT_BUDGETS: Record<AssetType, AssetBudget> = {
  "3d": { maxBytes: 2 * 1024 * 1024, maxTriangles: 100_000 },
  image: { maxBytes: 300 * 1024, maxDimension: 2560 },
  logo: { maxBytes: 50 * 1024, maxDimension: 1024 },
  video: { maxBytes: 5 * 1024 * 1024 },
  font: { maxBytes: 150 * 1024 },
};

export function budgetFor(asset: { type: AssetType; budgetBytes?: number; budgetTriangles?: number }): AssetBudget {
  const base = DEFAULT_BUDGETS[asset.type];
  return {
    ...base,
    ...(asset.budgetBytes ? { maxBytes: asset.budgetBytes } : {}),
    ...(asset.budgetTriangles ? { maxTriangles: asset.budgetTriangles } : {}),
  };
}

export const kb = (n: number): string => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${Math.ceil(n / 1024)} KB`);

// ── Measurement ───────────────────────────────────────────────

function pngDims(b: Buffer): [number, number] | undefined {
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return undefined;
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

function gifDims(b: Buffer): [number, number] | undefined {
  if (b.length < 10 || b.toString("ascii", 0, 3) !== "GIF") return undefined;
  return [b.readUInt16LE(6), b.readUInt16LE(8)];
}

function jpegDims(b: Buffer): [number, number] | undefined {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return undefined;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = b[i + 1]!;
    // Start-of-frame markers carry the size; DHT (C4), JPG (C8) and DAC (CC) do not.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return undefined;
}

function webpDims(b: Buffer): [number, number] | undefined {
  if (b.length < 30 || b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return undefined;
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)];
  }
  if (chunk === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  return undefined;
}

function svgDims(text: string): [number, number] | undefined {
  const tag = /<svg\b[^>]*>/i.exec(text)?.[0] ?? "";
  const num = (attr: string): number | undefined => {
    const v = new RegExp(`\\b${attr}=["']\\s*([\\d.]+)(px)?\\s*["']`, "i").exec(tag)?.[1];
    return v ? Number(v) : undefined;
  };
  const w = num("width");
  const h = num("height");
  if (w && h) return [w, h];
  const vb = /\bviewBox=["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i.exec(tag);
  return vb ? [Number(vb[1]), Number(vb[2])] : undefined;
}

interface Gltf {
  meshes?: Array<{ primitives: Array<{ attributes: Record<string, number>; indices?: number; mode?: number }> }>;
  accessors?: Array<{ count: number }>;
  images?: unknown[];
}

/** Geometry from a glTF binary: the JSON chunk is enough — no need to read the buffers. */
export function glbGeometry(b: Buffer): Pick<AssetMeasure, "triangles" | "vertices" | "meshes" | "textures"> {
  if (b.length < 20 || b.readUInt32LE(0) !== 0x46546c67) throw new Error("not a glTF binary (bad magic)");
  const version = b.readUInt32LE(4);
  if (version !== 2) throw new Error(`glTF binary version ${version} is not supported (2 only)`);
  const jsonLength = b.readUInt32LE(12);
  if (b.readUInt32LE(16) !== 0x4e4f534a) throw new Error("glTF binary has no JSON chunk first");
  const gltf = JSON.parse(b.toString("utf8", 20, 20 + jsonLength)) as Gltf;
  const count = (i?: number): number => (i === undefined ? 0 : (gltf.accessors?.[i]?.count ?? 0));
  let triangles = 0;
  let vertices = 0;
  for (const mesh of gltf.meshes ?? []) {
    for (const p of mesh.primitives) {
      const positions = count(p.attributes["POSITION"]);
      const n = p.indices !== undefined ? count(p.indices) : positions;
      vertices += positions;
      const mode = p.mode ?? 4;
      if (mode === 4) triangles += Math.floor(n / 3);
      else if (mode === 5 || mode === 6) triangles += Math.max(0, n - 2);
    }
  }
  return { triangles, vertices, meshes: gltf.meshes?.length ?? 0, textures: gltf.images?.length ?? 0 };
}

export function measureAsset(path: string): AssetMeasure {
  const b = readFileSync(path);
  const ext = extname(path).toLowerCase().slice(1);
  const sizeBytes = statSync(path).size;
  const base: AssetMeasure = { sizeBytes, format: ext || "unknown" };
  if (ext === "glb") return { ...base, ...glbGeometry(b) };
  const dims =
    ext === "png" ? pngDims(b)
    : ext === "jpg" || ext === "jpeg" ? jpegDims(b)
    : ext === "gif" ? gifDims(b)
    : ext === "webp" ? webpDims(b)
    : ext === "svg" ? svgDims(b.toString("utf8"))
    : undefined;
  return { ...base, ...(dims ? { dims } : {}) };
}

/** Every way the measurement exceeds the budget, with the numbers. Empty means within budget. */
export function overBudget(m: AssetMeasure, budget: AssetBudget): string[] {
  const out: string[] = [];
  if (m.sizeBytes > budget.maxBytes) out.push(`${kb(m.sizeBytes)} exceeds the ${kb(budget.maxBytes)} budget`);
  if (budget.maxTriangles !== undefined && (m.triangles ?? 0) > budget.maxTriangles) {
    out.push(`${m.triangles!.toLocaleString("en")} triangles exceed the ${budget.maxTriangles.toLocaleString("en")} budget`);
  }
  if (budget.maxDimension !== undefined && m.dims && Math.max(...m.dims) > budget.maxDimension) {
    out.push(`${m.dims[0]}×${m.dims[1]} px exceeds the ${budget.maxDimension} px limit`);
  }
  return out;
}

export function describeMeasure(m: AssetMeasure): string {
  const parts = [kb(m.sizeBytes), m.format];
  if (m.dims) parts.push(`${m.dims[0]}×${m.dims[1]} px`);
  if (m.triangles !== undefined) parts.push(`${m.triangles.toLocaleString("en")} triangles`, `${m.vertices!.toLocaleString("en")} vertices`);
  if (m.textures) parts.push(`${m.textures} texture(s)`);
  return parts.join(", ");
}

// ── Acquisition ───────────────────────────────────────────────

export interface Acquired {
  ok: boolean;
  /** Repo-relative path the asset now lives at. */
  path?: string;
  /** Where it came from, for provenance. */
  from?: string;
  detail: string;
}

/**
 * Bring an asset into the project at assets/<file>. The source may be a URL, an absolute path,
 * a path in the repo, or a path under one of the given asset folders. Fetching is done here, by
 * the engine — never by an agent.
 */
export async function acquireAsset(repoPath: string, src: string, folders: string[] = []): Promise<Acquired> {
  const dest = join("assets", basename(new URL(src, "file:///").pathname));
  const target = join(repoPath, dest);
  mkdirSync(join(repoPath, "assets"), { recursive: true });

  if (/^https?:\/\//i.test(src)) {
    try {
      const res = await fetch(src, { signal: AbortSignal.timeout(60_000), redirect: "follow" });
      if (!res.ok) return { ok: false, detail: `${src} answered ${res.status}` };
      writeFileSync(target, Buffer.from(await res.arrayBuffer()));
      return { ok: true, path: dest, from: src, detail: `downloaded ${src}` };
    } catch (e) {
      return { ok: false, detail: `could not download ${src}: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  const candidates = isAbsolute(src) ? [src] : [join(repoPath, src), ...folders.map((f) => join(f, src)), ...folders.map((f) => join(f, basename(src)))];
  const found = candidates.find((c) => existsSync(c) && statSync(c).isFile());
  if (!found) {
    return { ok: false, detail: `${src} not found (looked in the repo${folders.length ? ` and ${folders.join(", ")}` : ""})` };
  }
  if (found !== target) copyFileSync(found, target);
  return { ok: true, path: dest, from: found, detail: found === target ? `already at ${dest}` : `copied from ${found}` };
}

// ── Optimisation ──────────────────────────────────────────────

export interface AssetOptimizer {
  readonly name: string;
  applies(path: string): boolean;
  /** Optimise in place. Returns what changed; never makes the file larger. */
  optimize(path: string): Promise<{ changed: boolean; detail: string }>;
}

/** Safe, dependency-free SVG minification: comments, metadata and inter-tag whitespace. */
export const svgMinifier: AssetOptimizer = {
  name: "svg-minify",
  applies: (p) => extname(p).toLowerCase() === ".svg",
  async optimize(path) {
    const before = readFileSync(path, "utf8");
    const after = before
      .replace(/<\?xml[^>]*\?>/g, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
      .replace(/>\s+</g, "><")
      .trim();
    if (after.length >= before.length) return { changed: false, detail: "already minimal" };
    writeFileSync(path, after, "utf8");
    return { changed: true, detail: `${kb(before.length)} → ${kb(after.length)}` };
  },
};

/** Any command-line optimiser, e.g. gltf-transform or svgo, run as `cmd ...args <in> <out>`. */
export class CommandOptimizer implements AssetOptimizer {
  readonly name: string;
  readonly extensions: string[];
  readonly cmd: string;
  readonly args: string[];

  constructor(name: string, extensions: string[], cmd: string, args: string[] = []) {
    this.name = name;
    this.extensions = extensions;
    this.cmd = cmd;
    this.args = args;
  }

  applies(path: string): boolean {
    return this.extensions.includes(extname(path).toLowerCase());
  }

  async optimize(path: string): Promise<{ changed: boolean; detail: string }> {
    const out = `${path}.opt${extname(path)}`;
    await run(this.cmd, [...this.args, path, out], { timeout: 10 * 60_000 });
    const [before, after] = [statSync(path).size, statSync(out).size];
    if (after >= before) return { changed: false, detail: `${this.name} could not shrink it` };
    copyFileSync(out, path);
    return { changed: true, detail: `${this.name}: ${kb(before)} → ${kb(after)}` };
  }
}

/**
 * Rasters re-encoded with sharp (D2): PNG lossless at maximum compression, JPEG with mozjpeg and
 * WebP at quality 80. Never larger, never a different format.
 * ponytail: no resizing — an image over its pixel budget still gates; resizing to the budget is
 * the upgrade once a real asset needs it.
 */
export class SharpOptimizer implements AssetOptimizer {
  readonly name = "sharp";
  applies(path: string): boolean {
    return [".png", ".jpg", ".jpeg", ".webp"].includes(extname(path).toLowerCase());
  }
  async optimize(path: string): Promise<{ changed: boolean; detail: string }> {
    const sharp = createRequire(join(WEAVE_ROOT, "package.json"))("sharp") as (input: Buffer) => SharpChain;
    const before = readFileSync(path);
    const ext = extname(path).toLowerCase();
    const img = sharp(before);
    const after = await (ext === ".png"
      ? img.png({ compressionLevel: 9, adaptiveFiltering: true, effort: 10 })
      : ext === ".webp"
        ? img.webp({ quality: 80 })
        : img.jpeg({ quality: 80, mozjpeg: true })
    ).toBuffer();
    if (after.length >= before.length) return { changed: false, detail: "sharp could not shrink it" };
    writeFileSync(path, after);
    return { changed: true, detail: `sharp: ${kb(before.length)} → ${kb(after.length)}` };
  }
}
interface SharpChain {
  png(o: object): SharpChain;
  webp(o: object): SharpChain;
  jpeg(o: object): SharpChain;
  toBuffer(): Promise<Buffer>;
}

/** The built-in optimisers, plus sharp and gltf-transform when installed (D2: they are, as devDependencies). */
export async function defaultOptimizers(): Promise<AssetOptimizer[]> {
  const list: AssetOptimizer[] = [svgMinifier];
  const req = createRequire(join(WEAVE_ROOT, "package.json"));
  try {
    req.resolve("sharp");
    list.push(new SharpOptimizer());
  } catch {
    // not installed: rasters are measured and budgeted, not optimised — and the record says so
  }
  const gltf = toolBin("gltf-transform");
  try {
    await run(gltf === "gltf-transform" ? "which" : "test", gltf === "gltf-transform" ? [gltf] : ["-x", gltf]);
    // Quantize, not meshopt or Draco: those need a decoder the viewer fetches from a CDN, which the
    // egress allowlist and the site's CSP both refuse. Quantized meshes decode natively. No
    // simplify and no join: changing a model's geometry is a decision for the budget gate, and
    // joining turns shared instances into copies.
    list.push(new CommandOptimizer("gltf-transform", [".glb", ".gltf"], gltf, ["optimize", "--compress", "quantize", "--texture-compress", "webp", "--simplify", "false", "--join", "false", "--flatten", "false"]));
  } catch {
    // not installed: 3D is measured and budgeted, not optimised — and the record says so
  }
  return list;
}
