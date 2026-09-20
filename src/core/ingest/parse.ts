// Ingestion: parse a source file into facts (imports/exports) for the code graph.
// tree-sitter (TS/TSX/JS/JSX) primary; regex fallback for other languages / no grammar.

import { createRequire } from "node:module";
import { extname } from "node:path";

const require = createRequire(import.meta.url);

export interface FileFacts {
  language: string;
  imports: string[]; // module specifiers
  exports: string[]; // exported names (best-effort)
}

interface TSParsers {
  Parser: new () => { setLanguage: (l: unknown) => void; parse: (s: string) => { rootNode: TSNode } };
  typescript: unknown;
  tsx: unknown;
}
interface TSNode {
  type: string;
  text: string;
  namedChildren: TSNode[];
  childForFieldName(name: string): TSNode | null;
}

let cached: TSParsers | null | undefined;
function treeSitter(): TSParsers | null {
  if (cached !== undefined) return cached;
  try {
    const Parser = require("tree-sitter") as TSParsers["Parser"];
    const ts = require("tree-sitter-typescript") as { typescript: unknown; tsx: unknown };
    cached = { Parser, typescript: ts.typescript, tsx: ts.tsx };
  } catch {
    cached = null;
  }
  return cached;
}

export function languageOf(path: string): string {
  const ext = extname(path).toLowerCase();
  if (ext === ".ts" || ext === ".mts" || ext === ".cts") return "typescript";
  if (ext === ".tsx") return "tsx";
  if (ext === ".jsx") return "jsx";
  if (ext === ".js" || ext === ".mjs" || ext === ".cjs") return "javascript";
  return ext.replace(".", "") || "unknown";
}

const SUPPORTED = new Set(["typescript", "tsx", "javascript", "jsx"]);

export function parseFile(path: string, src: string): FileFacts {
  const language = languageOf(path);
  const ts = treeSitter();
  if (ts && SUPPORTED.has(language)) {
    try {
      return parseWithTreeSitter(ts, language, src);
    } catch {
      // fall through to regex
    }
  }
  return parseWithRegex(language, src);
}

function parseWithTreeSitter(ts: TSParsers, language: string, src: string): FileFacts {
  const parser = new ts.Parser();
  parser.setLanguage(language === "tsx" || language === "jsx" ? ts.tsx : ts.typescript);
  const root = parser.parse(src).rootNode;
  const imports: string[] = [];
  // tree-sitter gives precise import specifiers (used for dependency edges).
  walk(root, (n) => {
    if (n.type === "import_statement") {
      for (const c of n.namedChildren) if (c.type === "string") imports.push(unquote(c.text));
    } else if (n.type === "call_expression" && n.text.startsWith("require(")) {
      for (const c of n.namedChildren)
        if (c.type === "arguments") {
          for (const a of c.namedChildren) if (a.type === "string") imports.push(unquote(a.text));
        }
    }
  });
  // Export names are best-effort → regex (grammar-agnostic; not used for edges).
  return { language, imports, exports: exportNames(src) };
}

function exportNames(src: string): string[] {
  const out: string[] = [];
  const re = /export\s+(?:default\s+)?(?:const|function|class|let|var)\s+([A-Za-z0-9_$]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) out.push(m[1]!);
  return out;
}

function parseWithRegex(language: string, src: string): FileFacts {
  const imports: string[] = [];
  const re = /(?:import\s[^'"]*?from\s*|import\s*|require\(\s*)['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) imports.push(m[1]!);
  return { language, imports, exports: exportNames(src) };
}

function walk(node: TSNode, visit: (n: TSNode) => void): void {
  visit(node);
  for (const c of node.namedChildren) walk(c, visit);
}
function unquote(s: string): string {
  return s.replace(/^['"`]|['"`]$/g, "");
}
