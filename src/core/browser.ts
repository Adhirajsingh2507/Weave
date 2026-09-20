// Phase 5 — browser worker seam. Real adapter lazy-imports Playwright so the dep stays
// optional (install: pnpm add -D playwright && npx playwright install chromium).

export interface BrowserResult {
  ok: boolean;
  consoleErrors: string[];
  screenshotPath?: string;
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
