#!/usr/bin/env node
// MCP server entrypoint. Register with an MCP client as: command "weave-mcp".
import { startMcpServer } from "./server.js";

startMcpServer().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
