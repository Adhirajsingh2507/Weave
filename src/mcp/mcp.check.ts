// ponytail: smoke check — the MCP server constructs and registers tools without throwing.
// (Full stdio round-trip needs a client; construction validates the wiring.)

import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMcpServer } from "./server.js";

const repo = mkdtempSync(join(tmpdir(), "weave-mcp-"));
const server = createMcpServer(repo);
assert.ok(server, "server constructed");
assert.equal(typeof server.connect, "function");

rmSync(repo, { recursive: true, force: true });
console.log("mcp server check passed");
