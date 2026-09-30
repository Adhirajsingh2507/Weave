// ponytail: the MCP server, driven by a real MCP client over an in-memory transport. V2.6's exit:
// a client can list the styles, see their pictures, and select one. Construction alone proved
// nothing about what a client actually receives.

import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "./server.js";

const repo = mkdtempSync(join(tmpdir(), "weave-mcp-"));
const server = createMcpServer(repo);
const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
await server.connect(serverSide);
const client = new Client({ name: "weave-check", version: "0.0.0" });
await client.connect(clientSide);

const text = (res: unknown): string => ((res as { content: Array<{ text: string }> }).content[0]!.text);
const call = async (name: string, args: Record<string, unknown> = {}): Promise<unknown> =>
  JSON.parse(text(await client.callTool({ name, arguments: args })));

const tools = (await client.listTools()).tools.map((t) => t.name);
for (const t of ["init", "run", "gates", "resolve_gate", "list_styles", "suggest_styles"]) {
  assert.ok(tools.includes(t), `tool ${t} missing`);
}

// List: every guide, with what it is for and how many pictures it has.
const styles = (await call("list_styles")) as Array<{ slug: string; bestFor: string[]; pictures: number }>;
assert.equal(styles.length, 91);
assert.ok(styles.find((s) => s.slug === "minimalism")!.pictures > 0, "pictures are counted");
assert.equal(styles.filter((s) => (s as unknown as { links: number }).links > 0).length, 87, "87 styles carry reference links from the Pinterest list");

// Suggest: by brief.
const suggested = (await call("suggest_styles", { brief: "robotics hardware launch" })) as Array<{ slug: string; reasons: string[] }>;
assert.equal(suggested[0]?.slug, "futuristic");

// See: guides and pictures are resources a client can browse and read.
const resources = (await client.listResources()).resources;
assert.ok(resources.some((r) => r.uri === "style://futuristic"), "each guide is a resource");
const picture = resources.find((r) => r.uri.startsWith("style-picture://minimalism/"));
assert.ok(picture, "each reference picture is a resource");
const guide = await client.readResource({ uri: "style://futuristic" });
assert.match((guide.contents[0] as { text: string }).text, /slug: futuristic/);
const image = await client.readResource({ uri: picture!.uri });
const blob = (image.contents[0] as { blob: string; mimeType: string });
assert.ok(blob.blob.length > 1000 && /^image\//.test(blob.mimeType), "the picture itself arrives, typed");
await assert.rejects(
  client.readResource({ uri: "style-picture://minimalism/..%2F..%2Fpackage.json" }),
  "only listed pictures are served — no traversal",
);

const links = JSON.parse(((await client.readResource({ uri: "style-links://futuristic" })).contents[0] as { text: string }).text) as Array<{ url: string }>;
assert.ok(links.length >= 2 && links.every((l) => /^https:\/\/(in\.|www\.)?pinterest\.com\//.test(l.url)), "reference links are served as links");
assert.ok(!resources.some((r) => r.uri === "style-links://terminal-ui"), "a style with no links offers none");

// Select: run with the chosen style.
await call("init", { mode: "new" });
const handle = (await call("run", { style: "futuristic", text: "component: hero section", name: "Picked" })) as { runId: string; status: string };
assert.equal(handle.status, "gated");
const gates = (await call("gates")) as Array<{ kind: string }>;
assert.equal(gates[0]?.kind, "design-approval", "a style chosen by the client is not re-questioned");

await client.close();
rmSync(repo, { recursive: true, force: true });
console.log("mcp server check passed (client round-trip: list, suggest, see pictures and reference links, select a style)");
