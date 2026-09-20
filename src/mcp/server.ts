// MCP adapter (Post-V1, decided next delivery mode): the headless Engine exposed as MCP
// tools over stdio. Thin wrapper — same core, another frontend.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Engine } from "../core/api.js";

type ToolResult = { content: Array<{ type: "text"; text: string }> };
const asText = (v: unknown): ToolResult => ({ content: [{ type: "text", text: JSON.stringify(v, null, 2) }] });

export function createMcpServer(repoPath: string): McpServer {
  const engine = new Engine({ repoPath });
  const server = new McpServer({ name: "weave", version: "0.0.0" });

  server.registerTool(
    "init",
    { description: "Create the .agent/ workspace", inputSchema: { mode: z.enum(["new", "existing"]).default("new") } },
    async ({ mode }) => asText(await engine.init(mode)),
  );
  server.registerTool(
    "run",
    { description: "Intake + plan → design-approval gate", inputSchema: { text: z.string().optional(), name: z.string().optional() } },
    async ({ text, name }) => asText(await engine.run({ text, projectName: name })),
  );
  server.registerTool(
    "ingest",
    { description: "Sweep the repo → code graph", inputSchema: { changed: z.boolean().default(false) } },
    async ({ changed }) => asText(await engine.ingest({ changedOnly: changed })),
  );
  server.registerTool("status", { description: "Project status", inputSchema: {} }, async () => asText(await engine.status()));
  server.registerTool("gaps", { description: "Unrealized-design + orphan-code", inputSchema: {} }, async () => asText(await engine.gaps()));
  server.registerTool("gates", { description: "List open human gates", inputSchema: {} }, async () => asText(await engine.listGates()));
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
