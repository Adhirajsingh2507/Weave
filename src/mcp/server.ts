// MCP adapter (Post-V1, decided next delivery mode): the headless Engine exposed as MCP
// tools over stdio. Thin wrapper — same core, another frontend.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Engine, adapterDeps } from "../core/api.js";
import { GUIDE_DIR, listStyles, loadStyle, styleLinks, suggestStyles } from "../core/design/style.js";

/** Reference pictures live beside the guides, one folder per style. */
const PICTURE_DIR = join(GUIDE_DIR, "..", "demo-design");
const IMAGE_TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };

function picturesOf(slug: string): string[] {
  const dir = join(PICTURE_DIR, slug);
  if (!/^[a-z0-9-]+$/.test(slug) || !existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => IMAGE_TYPES[extname(f).toLowerCase()]).sort();
}

type ToolResult = { content: Array<{ type: "text"; text: string }> };
const asText = (v: unknown): ToolResult => ({ content: [{ type: "text", text: JSON.stringify(v, null, 2) }] });

export function createMcpServer(repoPath: string): McpServer {
  const engine = new Engine({ repoPath, deps: adapterDeps() });
  const server = new McpServer({ name: "weave", version: "0.0.0" });

  server.registerTool(
    "init",
    { description: "Create the .agent/ workspace", inputSchema: { mode: z.enum(["new", "existing"]).default("new") } },
    async ({ mode }) => asText(await engine.init(mode)),
  );
  server.registerTool(
    "run",
    {
      description:
        "Intake + plan → the intake gate. Give a line-directive brief, and optionally a style slug (see list_styles), " +
        "screenshot paths, or a URL to read the design from.",
      inputSchema: {
        text: z.string().optional(),
        name: z.string().optional(),
        style: z.string().optional(),
        screenshots: z.array(z.string()).optional(),
        url: z.string().optional(),
      },
    },
    async ({ text, name, style, screenshots, url }) =>
      asText(
        await engine.run({
          ...(text || style ? { text: [style ? `style: ${style}` : "", text ?? ""].filter(Boolean).join("\n") } : {}),
          ...(name ? { projectName: name } : {}),
          ...(screenshots?.length ? { screenshots } : {}),
          ...(url ? { url } : {}),
        }),
      ),
  );

  // ── Design presets (V2.6): the 91 guides, browsable and choosable by example ──
  server.registerTool(
    "list_styles",
    { description: "The 91 design guides: slug, title, what each is for and against, and how many reference pictures and reference links it has", inputSchema: {} },
    async () =>
      asText(
        listStyles().map((slug) => {
          const g = loadStyle(slug);
          return { slug, title: g.title, summary: g.summary, bestFor: g.bestFor, avoidFor: g.avoidFor, pictures: picturesOf(slug).length, links: styleLinks(slug).length };
        }),
      ),
  );
  server.registerTool(
    "suggest_styles",
    { description: "Three design guides that fit a brief, with the reasons, from each guide's best_for and avoid_for", inputSchema: { brief: z.string() } },
    async ({ brief }) => asText(suggestStyles(brief)),
  );
  server.registerResource(
    "style-guide",
    new ResourceTemplate("style://{slug}", {
      list: async () => ({
        resources: listStyles().map((slug) => ({ uri: `style://${slug}`, name: loadStyle(slug).title, mimeType: "text/markdown" })),
      }),
    }),
    { description: "A design guide: tokens, checks, and the look in words", mimeType: "text/markdown" },
    async (uri, { slug }) => {
      const s = String(slug);
      if (!listStyles().includes(s)) throw new Error(`unknown style '${s}'`);
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: readFileSync(join(GUIDE_DIR, `${s}.md`), "utf8") }] };
    },
  );
  server.registerResource(
    "style-picture",
    new ResourceTemplate("style-picture://{slug}/{file}", {
      list: async () => ({
        resources: listStyles().flatMap((slug) =>
          picturesOf(slug).map((file) => ({
            uri: `style-picture://${slug}/${file}`,
            name: `${slug}: ${file}`,
            mimeType: IMAGE_TYPES[extname(file).toLowerCase()]!,
          })),
        ),
      }),
    }),
    { description: "A reference picture for a design guide" },
    async (uri, { slug, file }) => {
      const s = String(slug);
      const f = String(file);
      // Only files the listing would offer: no paths, no traversal.
      if (!picturesOf(s).includes(f)) throw new Error(`no picture '${f}' for style '${s}'`);
      const mimeType = IMAGE_TYPES[extname(f).toLowerCase()]!;
      return { contents: [{ uri: uri.href, mimeType, blob: readFileSync(join(PICTURE_DIR, s, f)).toString("base64") }] };
    },
  );
  server.registerResource(
    "style-links",
    new ResourceTemplate("style-links://{slug}", {
      list: async () => ({
        resources: listStyles()
          .filter((slug) => styleLinks(slug).length)
          .map((slug) => ({ uri: `style-links://${slug}`, name: `${loadStyle(slug).title}: reference links`, mimeType: "application/json" })),
      }),
    }),
    { description: "Reference links for a design guide — links only, no images are copied", mimeType: "application/json" },
    async (uri, { slug }) => {
      const s = String(slug);
      if (!listStyles().includes(s)) throw new Error(`unknown style '${s}'`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(styleLinks(s), null, 2) }] };
    },
  );
  server.registerTool(
    "ingest",
    { description: "Sweep the repo → code graph", inputSchema: { changed: z.boolean().default(false) } },
    async ({ changed }) => asText(await engine.ingest({ changedOnly: changed })),
  );
  server.registerTool("status", { description: "Project status", inputSchema: {} }, async () => asText(await engine.status()));
  server.registerTool("gaps", { description: "Unrealized-design + orphan-code", inputSchema: {} }, async () => asText(await engine.gaps()));
  server.registerTool(
    "gates",
    {
      description: "List open human gates of the latest run (or one run, or every run)",
      inputSchema: { runId: z.string().optional(), all: z.boolean().optional() },
    },
    async ({ runId, all }) => asText(await engine.listGates({ ...(runId ? { runId } : {}), ...(all ? { all } : {}) })),
  );
  server.registerTool(
    "resolve_gate",
    { description: "Approve or reject a gate", inputSchema: { id: z.string(), decision: z.enum(["approve", "reject"]), notes: z.string().optional() } },
    async ({ id, decision, notes }) => {
      await engine.resolveGate(id, decision, notes);
      return asText({ ok: true });
    },
  );
  server.registerTool(
    "exec_graph",
    { description: "Execution graph for a run", inputSchema: { runId: z.string().optional() } },
    async ({ runId }) => asText(await engine.getExecGraph(runId)),
  );

  return server;
}

export async function startMcpServer(repoPath: string = process.cwd()): Promise<void> {
  const server = createMcpServer(repoPath);
  await server.connect(new StdioServerTransport());
}
