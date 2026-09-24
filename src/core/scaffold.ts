// The scaffold node: the fixed, non-AI step that gives agents a project to build on.
//
// Greenfield used to be impossible — an empty repo has no package.json, and a worktree
// has no node_modules, so the default verifier ran `pnpm build` against nothing and every
// node burned its retries. The template below has **zero dependencies**, so build and check
// work offline, in CI, and inside a fresh worktree.

import { execFile } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { styleTokensCss } from "./design/style.js";
import type { StyleGuide } from "./design/style.js";

const run = promisify(execFile);

export interface ScaffoldInput {
  repoPath: string;
  projectName: string;
  /** Chosen design guide; its tokens become styles/tokens.css. */
  style?: StyleGuide;
  /** Design node ids the agents will implement, used to seed the page outline. */
  sections?: string[];
}

export interface ScaffoldResult {
  files: string[];
  summary: string;
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

/**
 * Default scaffolder: a dependency-free static site whose `check` script asserts the
 * structural rules every style inherits from _base.md.
 */
export class TemplateScaffolder implements Scaffolder {
  readonly name = "template";

  async scaffold(input: ScaffoldInput): Promise<ScaffoldResult> {
    const { repoPath, projectName, style, sections = [] } = input;
    const files: string[] = [];

    write(repoPath, "package.json", `${JSON.stringify({
      name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-") || "site",
      private: true,
      type: "module",
      scripts: { build: "node scripts/build.mjs", check: "node scripts/check.mjs" },
    }, null, 2)}\n`, files);

    write(repoPath, "scripts/build.mjs", BUILD_SCRIPT, files);
    write(repoPath, "scripts/check.mjs", CHECK_SCRIPT, files);
    write(repoPath, "styles/tokens.css", style ? styleTokensCss(style) : DEFAULT_TOKENS, files);
    write(repoPath, "styles/base.css", BASE_CSS, files);
    write(repoPath, "index.html", indexHtml(projectName, sections), files);
    write(repoPath, ".gitignore", "node_modules/\ndist/\n", files);

    return {
      files,
      summary: `scaffolded ${files.length} files (${style ? style.title : "no style"}, zero dependencies)`,
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
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";

if (!existsSync("index.html")) {
  console.error("build: index.html is missing");
  process.exit(1);
}
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
cpSync("index.html", "dist/index.html");
if (existsSync("styles")) cpSync("styles", "dist/styles", { recursive: true });
if (existsSync("assets")) cpSync("assets", "dist/assets", { recursive: true });
for (const page of ["about.html", "products.html", "research.html"]) {
  if (existsSync(page)) cpSync(page, \`dist/\${page}\`);
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

if (!existsSync("styles/tokens.css")) failures.push("styles/tokens.css is missing");

if (failures.length) {
  console.error("check: " + failures.length + " problem(s)");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log("check: ok (" + pages.length + " page(s))");
`;

const DEFAULT_TOKENS = `/* No style chosen — neutral defaults. */
:root {
  --colors-palette-background: #ffffff;
  --colors-palette-foreground: #111111;
  --layout-max_width_px: 1120;
}
`;

const BASE_CSS = `/* Structural base only. Style decisions belong in tokens.css and the agent's work. */
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; }
img, video { max-width: 100%; height: auto; }
:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
`;

function indexHtml(projectName: string, sections: string[]): string {
  const placeholders = sections
    .map((s) => `    <section id="${s}" data-design-node="${s}"><!-- ${s}: not built yet --></section>`)
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${projectName}</title>
  <meta name="description" content="${projectName}">
  <link rel="stylesheet" href="styles/tokens.css">
  <link rel="stylesheet" href="styles/base.css">
</head>
<body>
  <main>
    <h1>${projectName}</h1>
${placeholders}
  </main>
</body>
</html>
`;
}
