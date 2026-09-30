// Browser worker seam. Playwright is the default (D2): full-page captures, console errors, a
// scroll pass so lazy and scroll-driven content renders. The Chrome CLI is the fallback.

import { execFile, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { promisify } from "node:util";
import { WEAVE_ROOT } from "./tools.js";
import { SNAPSHOT_SCRIPT } from "./design/rendered.js";
import type { PageSnapshot } from "./design/rendered.js";

const run = promisify(execFile);

export interface BrowserResult {
  ok: boolean;
  consoleErrors: string[];
  screenshotPath?: string;
  /** False when the worker cannot see the console — an empty list then proves nothing. */
  consoleCaptured?: boolean;
}

export interface BrowserWorker {
  capture(url: string, opts?: { screenshotPath?: string }): Promise<BrowserResult>;
  /** Computed styles of the rendered page, for the style-check runners (D3). Playwright only. */
  snapshot?(url: string): Promise<PageSnapshot>;
}

/** Software WebGL, so 3D renders headless without a GPU. */
const GL_ARGS = ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"];

export class PlaywrightBrowserWorker implements BrowserWorker {
  #width: number;
  #height: number;
  #fullPage: boolean;

  constructor(opts: { width?: number; height?: number; fullPage?: boolean } = {}) {
    this.#width = opts.width ?? 1280;
    this.#height = opts.height ?? 900;
    this.#fullPage = opts.fullPage ?? true;
  }

  /** Playwright installed in Weave, with its browser downloaded. Synchronous, for adapterDeps. */
  static available(): boolean {
    try {
      const pw = createRequire(join(WEAVE_ROOT, "package.json"))("playwright") as { chromium: { executablePath(): string } };
      return existsSync(pw.chromium.executablePath());
    } catch {
      return false;
    }
  }

  async capture(url: string, opts?: { screenshotPath?: string }): Promise<BrowserResult> {
    const { browser, page } = await openPage(this.#width, this.#height);
    const consoleErrors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    page.on("pageerror", (e) => consoleErrors.push(String(e)));
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
      await scrollThrough(page);
      if (opts?.screenshotPath) await page.screenshot({ path: opts.screenshotPath, fullPage: this.#fullPage });
    } finally {
      await browser.close();
    }
    return { ok: consoleErrors.length === 0, consoleErrors, consoleCaptured: true, ...(opts?.screenshotPath ? { screenshotPath: opts.screenshotPath } : {}) };
  }

  async snapshot(url: string): Promise<PageSnapshot> {
    const { browser, page } = await openPage(this.#width, this.#height);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
      await scrollThrough(page);
      return await page.evaluate<PageSnapshot>(SNAPSHOT_SCRIPT);
    } finally {
      await browser.close();
    }
  }
}

/** A Playwright page on Weave's own Chromium. Callers close the browser. */
export async function openPage(width = 1280, height = 900): Promise<{ browser: PWBrowser; page: PWPage }> {
  const spec = join(WEAVE_ROOT, "node_modules", "playwright", "index.mjs");
  let mod: { chromium: { launch: (o?: { args?: string[] }) => Promise<PWBrowser> } };
  try {
    mod = (await import(spec)) as typeof mod;
  } catch {
    throw new Error("playwright not installed — run: pnpm install && pnpm exec playwright install chromium");
  }
  const browser = await mod.chromium.launch({ args: GL_ARGS });
  // A context, not browser.newPage(): axe refuses pages without one.
  const page = await (await browser.newContext({ viewport: { width, height } })).newPage();
  return { browser, page };
}

/** Scroll to the bottom in viewport steps and back, so lazy images and scroll triggers fire. */
async function scrollThrough(page: PWPage): Promise<void> {
  // A string, not a function: this build has no DOM types, and the code runs in the page.
  await page.evaluate(`(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  })()`);
}

const CHROMES = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"];

/**
 * Headless Chrome from the command line — no dependency, just an installed browser (V2.7).
 * Chrome's own sandbox stays on: the page is agent-written HTML and script. The CLI cannot take
 * full-page captures or report console errors, so the window is tall and `consoleCaptured` is
 * false; Playwright is the upgrade when those matter.
 */
export class ChromeBrowserWorker implements BrowserWorker {
  #bin: string;
  #size: string;

  constructor(opts: { bin?: string; width?: number; height?: number } = {}) {
    const bin = opts.bin ?? ChromeBrowserWorker.find();
    if (!bin) throw new Error(`no Chrome or Chromium found (looked for ${CHROMES.join(", ")})`);
    this.#bin = bin;
    this.#size = `${opts.width ?? 1280},${opts.height ?? 2400}`;
  }

  /** The first Chrome-family binary on PATH, if any. */
  static find(): string | undefined {
    for (const c of CHROMES) {
      try {
        return execFileSync("which", [c], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || undefined;
      } catch {
        // try the next one
      }
    }
    return undefined;
  }

  async capture(url: string, opts?: { screenshotPath?: string }): Promise<BrowserResult> {
    const shot = opts?.screenshotPath;
    await run(
      this.#bin,
      [
        "--headless=new",
        "--hide-scrollbars",
        "--disable-gpu",
        "--enable-unsafe-swiftshader", // software WebGL, so 3D can render without a GPU
        `--window-size=${this.#size}`,
        "--virtual-time-budget=5000", // let scripts and models load before the capture
        ...(shot ? [`--screenshot=${shot}`] : ["--dump-dom"]),
        url,
      ],
      { timeout: 120_000, maxBuffer: 64 * 1024 * 1024 },
    );
    const ok = shot ? existsSync(shot) : true;
    return { ok, consoleErrors: [], consoleCaptured: false, ...(shot && ok ? { screenshotPath: shot } : {}) };
  }
}

/** Deterministic fake for tests/offline (no browser). */
export class FakeBrowserWorker implements BrowserWorker {
  async capture(_url: string, opts?: { screenshotPath?: string }): Promise<BrowserResult> {
    return { ok: true, consoleErrors: [], screenshotPath: opts?.screenshotPath };
  }
}

// Minimal Playwright surface we use (avoids depending on its types at build time).
export interface PWBrowser {
  newContext(opts?: { viewport?: { width: number; height: number } }): Promise<{ newPage(): Promise<PWPage> }>;
  close(): Promise<void>;
}
interface PWConsoleMsg {
  type(): string;
  text(): string;
}
export interface PWPage {
  on(event: "console", cb: (m: PWConsoleMsg) => void): void;
  on(event: "pageerror", cb: (e: unknown) => void): void;
  goto(url: string, opts?: { waitUntil?: string; timeout?: number }): Promise<unknown>;
  screenshot(opts?: { path?: string; fullPage?: boolean }): Promise<Buffer>;
  evaluate<R = unknown>(script: string): Promise<R>;
}
