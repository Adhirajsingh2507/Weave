// The scaffold node: the fixed, non-AI step that gives agents a project to build on.
//
// Greenfield used to be impossible — an empty repo has no package.json, and a worktree
// has no node_modules, so the default verifier ran `pnpm build` against nothing and every
// node burned its retries. The template below has **zero dependencies**, so build and check
// work offline, in CI, and inside a fresh worktree.

import { execFile } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { styleTokensCss } from "./design/style.js";
import { styleThemeCss } from "./design/theme.js";
import { WEAVE_ROOT } from "./tools.js";
import type { StyleGuide } from "./design/style.js";
import type { PageLayout } from "./plan.js";

const run = promisify(execFile);

export interface ScaffoldInput {
  repoPath: string;
  projectName: string;
  /** Chosen design guide; its tokens become styles/tokens.css. */
  style?: StyleGuide;
  /** Component ids to slot into index.html when the IR has no pages. */
  sections?: string[];
  /** Pages and their component slots. Takes precedence over `sections`. */
  pages?: PageLayout[];
  /** The design places a 3D model: bundle the viewer into vendor/ and load it on every page (D4). */
  viewer3d?: boolean;
}

export interface ScaffoldResult {
  files: string[];
  summary: string;
  /**
   * True when this step created the template project, so the fragment contract holds:
   * components write sections/<id>.html, pages own their file, integration assembles.
   */
  contract?: boolean;
}

export interface Scaffolder {
  readonly name: string;
  scaffold(input: ScaffoldInput): Promise<ScaffoldResult>;
}

function write(repoPath: string, rel: string, body: string, files: string[]): void {
  const path = join(repoPath, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body, "utf8");
  files.push(rel);
}

/** Never clobber something the user already has. */
function writeIfAbsent(repoPath: string, rel: string, body: string, files: string[]): void {
  if (existsSync(join(repoPath, rel))) return;
  write(repoPath, rel, body, files);
}

/**
 * Default scaffolder: a dependency-free static site whose `check` script asserts the
 * structural rules every style inherits from _base.md.
 */
export class TemplateScaffolder implements Scaffolder {
  readonly name = "template";

  async scaffold(input: ScaffoldInput): Promise<ScaffoldResult> {
    const { repoPath, projectName, style, sections = [] } = input;
    const pages: Array<Pick<PageLayout, "file" | "sections"> & { id?: string; name?: string }> =
      input.pages?.length ? input.pages : [{ file: "index.html", sections }];
    const files: string[] = [];

    // tokens.css is generated from the design guide and owned by Weave, so it is the one
    // file that is always (re)written.
    write(repoPath, "styles/tokens.css", style ? styleTokensCss(style) : DEFAULT_TOKENS, files);
    // theme.css applies those tokens to plain markup (D3), so every style renders as itself
    // before any agent writes a line. Generated and owned by Weave, like tokens.css.
    write(repoPath, "styles/theme.css", style ? styleThemeCss(style) : "/* No style chosen. */\n", files);

    // Modify-existing mode is a supported project mode (decision #4). Scaffolding over a
    // real project would destroy its package.json, entry point and .gitignore, so the
    // template only ever creates a project where there isn't one.
    if (existsSync(join(repoPath, "package.json"))) {
      return {
        files,
        summary: `existing project kept; wrote styles/tokens.css and styles/theme.css${style ? ` for ${style.title}` : ""}`,
      };
    }

    write(repoPath, "package.json", `${JSON.stringify({
      name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-") || "site",
      private: true,
      type: "module",
      scripts: { build: "node scripts/build.mjs", check: "node scripts/check.mjs" },
    }, null, 2)}\n`, files);

    write(repoPath, "scripts/build.mjs", BUILD_SCRIPT, files);
    // Deploy headers the live checks look for, and a CSP that allows this site's own files only.
    write(repoPath, "vercel.json", VERCEL_JSON, files);
    if (input.viewer3d) {
      // Bundled, not loaded from a CDN: the egress allowlist and the CSP both refuse CDNs, and a
      // render must not depend on the network. Models are optimised with mesh quantisation, which
      // the viewer decodes natively — no decoder download either.
      mkdirSync(join(repoPath, "vendor"), { recursive: true });
      copyFileSync(join(WEAVE_ROOT, "node_modules", "@google", "model-viewer", "dist", "model-viewer.min.js"), join(repoPath, "vendor", "model-viewer.min.js"));
      files.push("vendor/model-viewer.min.js");
      write(repoPath, "vendor/README.md", VENDOR_README, files);
    }
    write(repoPath, "scripts/check.mjs", CHECK_SCRIPT, files);
    write(repoPath, "styles/base.css", BASE_CSS, files);
    for (const page of pages) {
      const title = page.file === "index.html" ? projectName : `${page.name ?? page.id} — ${projectName}`;
      const heading = page.file === "index.html" ? projectName : (page.name ?? page.id ?? projectName);
      writeIfAbsent(repoPath, page.file, pageHtml(title, heading, page.sections, page.id, input.viewer3d), files);
    }
    writeIfAbsent(repoPath, ".gitignore", "node_modules/\ndist/\n", files);

    return {
      files,
      summary: `scaffolded ${files.length} files (${style ? style.title : "no style"}, zero dependencies)`,
      contract: true,
    };
  }
}

/** Escape hatch: run a project's own scaffold command instead of the template. */
export class CommandScaffolder implements Scaffolder {
  readonly name = "command";
  #cmd: string;
  #args: string[];
  #timeoutMs: number;

  constructor(cmd: string, args: string[] = [], opts: { timeoutMs?: number } = {}) {
    this.#cmd = cmd;
    this.#args = args;
    this.#timeoutMs = opts.timeoutMs ?? 10 * 60_000;
  }

  async scaffold(input: ScaffoldInput): Promise<ScaffoldResult> {
    const { stdout } = await run(this.#cmd, this.#args, {
      cwd: input.repoPath,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      timeout: this.#timeoutMs,
    });
    return { files: [], summary: stdout.trim().slice(0, 2000) };
  }
}

const BUILD_SCRIPT = `// Dependency-free build: copy the site into dist/ and fail on missing entry points.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";

if (!existsSync("index.html")) {
  console.error("build: index.html is missing");
  process.exit(1);
}
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
cpSync("index.html", "dist/index.html");
if (existsSync("styles")) cpSync("styles", "dist/styles", { recursive: true });
if (existsSync("assets")) cpSync("assets", "dist/assets", { recursive: true });
if (existsSync("vendor")) cpSync("vendor", "dist/vendor", { recursive: true });
// Vercel deploys dist/, so its config — the security headers — has to be in it.
if (existsSync("vercel.json")) cpSync("vercel.json", "dist/vercel.json");
for (const page of readdirSync(".").filter((f) => f.endsWith(".html"))) {
  cpSync(page, \`dist/\${page}\`);
}
console.log("build: ok");
`;

const CHECK_SCRIPT = `// Dependency-free structural checks. These mirror the floor in design-guide/_base.md,
// so a node cannot pass verification while breaking the rules every style inherits.
import { existsSync, readFileSync, readdirSync } from "node:fs";

const failures = [];
const pages = readdirSync(".").filter((f) => f.endsWith(".html"));
if (!pages.length) failures.push("no html pages found");

for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const h1 = (html.match(/<h1[\\s>]/gi) ?? []).length;
  if (h1 !== 1) failures.push(\`\${page}: expected exactly one <h1>, found \${h1}\`);
  if (!/<html[^>]+lang=/i.test(html)) failures.push(\`\${page}: <html> needs a lang attribute\`);
  if (!/<title>[^<]+<\\/title>/i.test(html)) failures.push(\`\${page}: missing a non-empty <title>\`);
  if (!/<meta[^>]+name=["']description["']/i.test(html)) failures.push(\`\${page}: missing meta description\`);
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) failures.push(\`\${page}: missing viewport meta\`);
  for (const img of html.match(/<img\\b[^>]*>/gi) ?? []) {
    if (!/\\balt=/i.test(img)) failures.push(\`\${page}: <img> without alt text\`);
  }
}

// Fragments are assembled into a page that already has its one <h1>.
const fragments = existsSync("sections") ? readdirSync("sections").filter((f) => f.endsWith(".html")) : [];
for (const f of fragments) {
  if (/<h1[\\s>]/i.test(readFileSync("sections/" + f, "utf8"))) {
    failures.push(\`sections/\${f}: a section must not contain an <h1> — the page owns it; use <h2>\`);
  }
}

if (!existsSync("styles/tokens.css")) failures.push("styles/tokens.css is missing");

if (failures.length) {
  console.error("check: " + failures.length + " problem(s)");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log("check: ok (" + pages.length + " page(s))");
`;

/**
 * Security headers for Vercel (the pack's live checks read HSTS, nosniff, framing, referrer).
 * The CSP allows this site's own files only; `blob:` is how the 3D viewer hands textures and
 * workers to WebGL, and inline styles are allowed because web components set style attributes.
 * 'wasm-unsafe-eval' lets the bundled viewer compile its WebAssembly (observed: refused otherwise,
 * with a console error that fails browser QA); it does not allow JavaScript eval.
 */
export const CSP =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; " +
  "connect-src 'self' data: blob:; worker-src 'self' blob:; font-src 'self'; media-src 'self' blob:; " +
  "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

const VERCEL_JSON = `${JSON.stringify(
  {
    headers: [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ],
  },
  null,
  2,
)}\n`;

const VENDOR_README = `# vendor/

Third-party files bundled by Weave's scaffold so the site renders offline and under its own CSP.

- \`model-viewer.min.js\` — Google's <model-viewer> ${"4.3.1"}, Apache-2.0 (bundled dependencies keep
  the licence headers in the file). Use: \`<model-viewer src="assets/model.glb" alt="…" camera-controls
  auto-rotate></model-viewer>\`. Load it with \`<script type="module" src="vendor/model-viewer.min.js">\`.
`;

const DEFAULT_TOKENS = `/* No style chosen — neutral defaults. */
:root {
  --colors-palette-background: #ffffff;
  --colors-palette-foreground: #111111;
  --layout-max_width_px: 1120;
}
`;

const BASE_CSS = `/* Structural base only. Style decisions belong in tokens.css and the agent's work. */
.skip-link { position: absolute; left: -9999px; }
.skip-link:focus { left: 0; top: 0; padding: 0.5rem 1rem; background: #fff; color: #000; }
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; }
img, video { max-width: 100%; height: auto; }
:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
`;

function pageHtml(title: string, heading: string, sections: string[], pageId?: string, viewer3d?: boolean): string {
  const placeholders = sections
    // data-placeholder is what lets verification tell "stubbed" from "built" — without it a
    // no-op agent passes, because the scaffold already put the element on the page.
    .map((s) => `    <section id="${s}" data-design-node="${s}" data-placeholder><!-- ${s}: not built yet --></section>`)
    .join("\n");
  // The page node builds the shell around the slots and drops this marker when it does.
  const body = pageId ? `<body id="${pageId}" data-design-node="${pageId}" data-placeholder>` : "<body>";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${title}">
  <link rel="stylesheet" href="styles/tokens.css">
  <link rel="stylesheet" href="styles/base.css">
  <link rel="stylesheet" href="styles/theme.css">${viewer3d ? '\n  <script type="module" src="vendor/model-viewer.min.js"></script>' : ""}
</head>
${body}
  <a class="skip-link" href="#main">Skip to content</a>
  <main id="main">
    <h1>${heading}</h1>
${placeholders}
  </main>
</body>
</html>
`;
}

export interface AssemblyResult {
  /** Section ids whose fragment is now in their page. */
  assembled: string[];
  /** Slots still holding a placeholder with no fragment to fill them. */
  missing: string[];
  /** Page files that changed. */
  files: string[];
}

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Integration's deterministic half: put each sections/<id>.html into its page's slot.
 * Idempotent — an assembled fragment sits between markers, so re-assembly replaces it.
 */
export function assembleFragments(
  repoPath: string,
  pages: Array<Pick<PageLayout, "file" | "sections">>,
): AssemblyResult {
  const result: AssemblyResult = { assembled: [], missing: [], files: [] };
  for (const page of pages) {
    const path = join(repoPath, page.file);
    if (!existsSync(path)) continue;
    const before = readFileSync(path, "utf8");
    let html = before;
    for (const id of page.sections) {
      const fragPath = join(repoPath, "sections", `${id}.html`);
      const marked = new RegExp(`<!-- weave:fragment ${esc(id)} -->[\\s\\S]*?<!-- /weave:fragment ${esc(id)} -->`);
      const slot = new RegExp(
        `<([a-z]+)\\b[^>]*data-design-node=["']${esc(id)}["'][^>]*\\bdata-placeholder\\b[^>]*>[\\s\\S]*?</\\1>`,
        "i",
      );
      if (!existsSync(fragPath)) {
        if (slot.test(html)) result.missing.push(id);
        continue;
      }
      const block = `<!-- weave:fragment ${id} -->\n${readFileSync(fragPath, "utf8").trim()}\n<!-- /weave:fragment ${id} -->`;
      if (marked.test(html)) html = html.replace(marked, () => block);
      else if (slot.test(html)) html = html.replace(slot, () => block);
      else continue;
      // A component cannot edit the page, so its stylesheet is linked here.
      const css = `styles/sections/${id}.css`;
      if (existsSync(join(repoPath, css)) && !html.includes(`href="${css}"`)) {
        html = html.replace("</head>", `  <link rel="stylesheet" href="${css}">\n</head>`);
      }
      result.assembled.push(id);
    }
    if (html !== before) {
      writeFileSync(path, html, "utf8");
      result.files.push(page.file);
    }
  }
  return result;
}
