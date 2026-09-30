// Phase 5 — browser worker seam. Real adapter lazy-imports Playwright so the dep stays
// optional (install: pnpm add -D playwright && npx playwright install chromium).

import { execFile, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";

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
}

export class PlaywrightBrowserWorker implements BrowserWorker {
  async capture(url: string, opts?: { screenshotPath?: string }): Promise<BrowserResult> {
    // Variable specifier keeps TS from requiring the optional dep at build time.
    const spec = "playwright";
    let mod: { chromium: { launch: () => Promise<PWBrowser> } };
    try {
      mod = (await import(spec)) as typeof mod;
    } catch {
      throw new Error(
        "playwright not installed — run: pnpm add -D playwright && npx playwright install chromium",
      );
    }
    const browser = await mod.chromium.launch();
    const page = await browser.newPage();
    const consoleErrors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    page.on("pageerror", (e) => consoleErrors.push(String(e)));
    await page.goto(url, { waitUntil: "networkidle" });
    if (opts?.screenshotPath) await page.screenshot({ path: opts.screenshotPath, fullPage: true });
    await browser.close();
    return { ok: consoleErrors.length === 0, consoleErrors, screenshotPath: opts?.screenshotPath };
  }
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

// Minimal Playwright surface we use (avoids depending on its types).
interface PWBrowser {
  newPage(): Promise<PWPage>;
  close(): Promise<void>;
}
interface PWConsoleMsg {
  type(): string;
  text(): string;
}
interface PWPage {
  on(event: "console", cb: (m: PWConsoleMsg) => void): void;
  on(event: "pageerror", cb: (e: unknown) => void): void;
  goto(url: string, opts?: { waitUntil?: string }): Promise<unknown>;
  screenshot(opts: { path: string; fullPage?: boolean }): Promise<unknown>;
}
