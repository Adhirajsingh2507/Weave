// D0 — `weave doctor` against a stand-in `claude`: a subscription login and a model that answers
// pass; an API key in the shell never reaches an agent in subscription mode; a missing tool fails
// with its fix. The real call is made by `weave doctor` itself, on the owner's machine.

import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { doctor, renderDoctor } from "./doctor.js";
import { ISOLATED_CLAUDE_ARGS, scrubbedEnv, weaveMode } from "./runtime.js";

// Mode and billing: a key in the shell stays out of agents unless API mode is chosen.
assert.equal(weaveMode({}), "subscription");
assert.equal(weaveMode({ WEAVE_MODE: "api" }), "api");
process.env["ANTHROPIC_API_KEY"] = "sk-stray";
assert.equal(scrubbedEnv([], "subscription")["ANTHROPIC_API_KEY"], undefined, "subscription mode must not pass an API key");
assert.equal(scrubbedEnv([], "api")["ANTHROPIC_API_KEY"], "sk-stray");
delete process.env["ANTHROPIC_API_KEY"];
assert.ok(ISOLATED_CLAUDE_ARGS.includes("--strict-mcp-config") && ISOLATED_CLAUDE_ARGS.includes("--setting-sources"));

// A stand-in claude: logged in on a subscription, answers as Opus 5.5, and records its argv.
const dir = mkdtempSync(join(tmpdir(), "weave-doctor-"));
const argvLog = join(dir, "argv");
const fake = join(dir, "claude");
writeFileSync(
  fake,
  `#!/bin/sh
echo "$@" >> "${argvLog}"
case "$1" in
  --version) echo "9.9.9 (Claude Code)";;
  auth) echo '{"loggedIn":true,"authMethod":"claude.ai","subscriptionType":"pro"}';;
  -p) echo '{"is_error":false,"structured_output":{"ok":true},"modelUsage":{"claude-opus-5-5":{}}}';;
esac
`,
);
chmodSync(fake, 0o755);

const rows = await doctor({ claudeBin: fake, vercelBin: join(dir, "no-vercel"), gitleaksBin: join(dir, "no-gitleaks"), env: {} });
const by = (name: string) => rows.find((r) => r.name === name)!;
assert.equal(by("claude CLI").status, "ok");
assert.equal(by("login").detail, "subscription (pro)");
assert.equal(by("agent billing").status, "ok");
assert.equal(by("claude-opus-5-5 + egress").status, "ok", by("claude-opus-5-5 + egress").detail);
assert.equal(by("vercel CLI").status, "fail");
assert.ok(by("gitleaks").fix, "a failing row names its fix");
assert.equal(by("jev key").status, "later", "Jev is a later phase, not a failure now");
assert.match(renderDoctor(rows), /item\(s\) failing/);

// The real call runs isolated from the user's MCP servers and plugins.
const { readFileSync } = await import("node:fs");
const call = readFileSync(argvLog, "utf8").split("\n").find((l) => l.startsWith("-p"))!;
assert.ok(call.includes("--strict-mcp-config") && call.includes("--model claude-opus-5-5"), call);

// A logged-out claude fails the login row; --offline skips the model call instead of passing it.
writeFileSync(fake, `#!/bin/sh\ncase "$1" in --version) echo 1;; auth) echo '{"loggedIn":false}';; esac\n`);
const off = await doctor({ claudeBin: fake, vercelBin: fake, gitleaksBin: fake, env: {}, offline: true });
assert.equal(off.find((r) => r.name === "login")!.status, "fail");
assert.equal(off.find((r) => r.name === "claude-opus-5-5 + egress")!.status, "later");

console.log("doctor.check ok");
