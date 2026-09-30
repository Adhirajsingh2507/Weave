// ponytail: V2.4 — enforcement outside the prompt. The real ClaudeCodeExecutor runs a stand-in
// `claude` binary that tries to read the .env in its worktree and the .env in the user's real
// checkout, and to reach a host off the allowlist. It reports what it saw.
//
// Where bubblewrap works, both reads must fail. Where it cannot run (no binary, or unprivileged
// user namespaces restricted — common in CI containers), the check says so and asserts the
// executor does not claim to be sandboxed. It never passes quietly on an unproven machine.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer, request } from "node:http";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_ALLOW_HOSTS, EgressProxy, hostAllowed } from "./egress.js";
import { ClaudeCodeExecutor, GitHarness, nativeDenyRules, scrubbedEnv } from "./runtime.js";
import { deniedPaths, detectSandbox, globToRegExp } from "./sandbox.js";
import type { ContextPack } from "./runtime.js";

const git = (a: string[], cwd: string): string => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();

// ── Pure pieces ───────────────────────────────────────────────
const g = (glob: string, path: string): boolean => globToRegExp(glob).test(path);
assert.ok(g(".env", ".env") && !g(".env", "app/.env"), "a bare name matches only at the root");
assert.ok(g("**/.env", ".env") && g("**/.env", "a/b/.env"), "** matches any depth, including none");
assert.ok(g("**/*.pem", "certs/key.pem") && !g("**/*.pem", "certs/key.pem.txt"));
assert.ok(g("**/secrets/**", "config/secrets/db.json") && !g("**/secrets/**", "secrets.md"));
assert.deepEqual(nativeDenyRules([".env", "**/*.pem"]), ["Read(./.env)", "Edit(./.env)", "Read(**/*.pem)", "Edit(**/*.pem)"]);
assert.ok(hostAllowed("api.anthropic.com", DEFAULT_ALLOW_HOSTS) && hostAllowed("x.anthropic.com", ["*.anthropic.com"]));
assert.ok(!hostAllowed("anthropic.com.evil.io", ["*.anthropic.com"]), "suffix match is on a dot boundary");

// Deploy and cloud secrets in the engine's environment never reach an agent.
process.env["VERCEL_TOKEN"] = "vercel-secret";
process.env["AWS_SECRET_ACCESS_KEY"] = "aws-secret";
const agentEnv = scrubbedEnv();
assert.equal(agentEnv["VERCEL_TOKEN"], undefined, "a deploy token must not reach the agent");
assert.equal(agentEnv["AWS_SECRET_ACCESS_KEY"], undefined);
delete process.env["VERCEL_TOKEN"];
delete process.env["AWS_SECRET_ACCESS_KEY"];

// ── The egress proxy, on loopback only ────────────────────────
{
  const target = await new Promise<{ port: number; close: () => void }>((resolve) => {
    const s = createServer((_req, res) => res.end("hello")).listen(0, "127.0.0.1", () => {
      const a = s.address();
      resolve({ port: typeof a === "object" && a ? a.port : 0, close: () => s.close() });
    });
  });
  const proxy = new EgressProxy(["127.0.0.1"]);
  const url = new URL(await proxy.start());

  const tunnel = (host: string): Promise<string> =>
    new Promise((resolve) => {
      const s = connect(Number(url.port), url.hostname, () => s.write(`CONNECT ${host} HTTP/1.1\r\nHost: ${host}\r\n\r\n`));
      s.once("data", (d) => {
        resolve(d.toString().split("\r\n")[0]!);
        s.destroy();
      });
      s.on("error", () => resolve("error"));
    });
  assert.match(await tunnel(`127.0.0.1:${target.port}`), / 200 /, "an allowlisted host is tunnelled");
  assert.match(await tunnel("blocked.invalid:443"), / 403 /, "an off-list host is refused");

  const viaProxy = (href: string): Promise<number> =>
    new Promise((resolve) => {
      const req = request({ host: url.hostname, port: Number(url.port), path: href, method: "GET" }, (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      });
      req.on("error", () => resolve(0));
      req.end();
    });
  assert.equal(await viaProxy(`http://127.0.0.1:${target.port}/`), 200, "plain HTTP is relayed when allowed");
  assert.equal(await viaProxy("http://blocked.invalid/"), 403);

  const hosts = proxy.records;
  assert.deepEqual(hosts.map((h) => [h.host, h.allowed]), [["127.0.0.1", true], ["blocked.invalid", false]], "every host is on the record");
  await proxy.stop();
  target.close();
}

// ── The executor, end to end ──────────────────────────────────
const repo = mkdtempSync(join(tmpdir(), "weave-sandbox-"));
git(["init", "-q"], repo);
git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
git(["config", "user.email", "t@w.local"], repo);
git(["config", "user.name", "W"], repo);
writeFileSync(join(repo, "README.md"), "# t\n");
writeFileSync(join(repo, ".gitignore"), ".env\n");
git(["add", "-A"], repo);
git(["commit", "-q", "-m", "init"], repo);
// Ignored, as a real .env is — so the harness's auto-stash leaves it in the checkout. (An
// untracked-but-not-ignored .env would be stashed away, and the check would pass vacuously.)
writeFileSync(join(repo, ".env"), "SECRET=from-the-real-checkout\n");

const harness = new GitHarness(repo);
await harness.createWorkingBranch("weave/sandbox");
assert.equal(readFileSync(join(repo, ".env"), "utf8"), "SECRET=from-the-real-checkout\n", "the checkout's .env is still there to protect");
const wt = await harness.worktreeForNode("impl:probe");
writeFileSync(join(wt, ".env"), "SECRET=in-the-worktree\n");
writeFileSync(join(wt, "notes.txt"), "ordinary file\n");
assert.deepEqual(deniedPaths(wt, ["**/.env"]), [join(wt, ".env")], "the worktree's .env is found for masking");

// The stand-in agent: records what it could read and what the network let it do.
const bin = join(mkdtempSync(join(tmpdir(), "weave-fake-claude-")), "claude");
writeFileSync(
  bin,
  `#!/usr/bin/env node
const fs = require("node:fs");
const net = require("node:net");
const read = (p) => { try { return fs.readFileSync(p, "utf8"); } catch (e) { return "ERR:" + e.code; } };
const prompt = process.argv[process.argv.indexOf("-p") + 1] || "";
const repo = (/REPO=(\\S+)/.exec(prompt) || [])[1];
const settings = process.argv[process.argv.indexOf("--settings") + 1] || "{}";
const seen = {
  worktreeEnv: read(".env"),
  repoEnv: read(repo + "/.env"),
  ordinary: read("notes.txt"),
  deny: JSON.parse(settings).permissions.deny,
  proxy: process.env.HTTPS_PROXY || "",
  vercel: process.env.VERCEL_TOKEN || "",
};
const u = new URL(seen.proxy);
const s = net.connect(Number(u.port), u.hostname, () => s.write("CONNECT blocked.invalid:443 HTTP/1.1\\r\\nHost: blocked.invalid\\r\\n\\r\\n"));
s.once("data", (d) => {
  seen.egress = d.toString().split("\\r\\n")[0];
  s.destroy();
  fs.writeFileSync("seen.json", JSON.stringify(seen));
  console.log("probe done");
});
`,
);
chmodSync(bin, 0o755);

const pack: ContextPack = {
  taskId: "impl:probe",
  goal: `probe REPO=${repo}`,
  relevantNodeIds: [],
  relevantFiles: [],
  constraints: [],
  previousFailures: [],
  permissions: { write: ["**"], deny: [".env", "**/.env", "**/*.pem", "**/secrets/**"] },
};
process.env["VERCEL_TOKEN"] = "vercel-secret";
const executor = new ClaudeCodeExecutor({ bin, timeoutMs: 30_000 });
const result = await executor.run({ contextPack: pack, worktreeDir: wt, repoPath: repo });
delete process.env["VERCEL_TOKEN"];
assert.ok(result.ok, `the probe should run: ${result.summary}`);
const seen = JSON.parse(readFileSync(join(wt, "seen.json"), "utf8")) as Record<string, unknown>;

// Native layer and network layer hold everywhere.
assert.ok((seen["deny"] as string[]).includes("Read(./.env)"), "Claude Code is handed the deny rules");
assert.match(String(seen["proxy"]), /^http:\/\/127\.0\.0\.1:\d+$/, "agent traffic is routed through the proxy");
assert.match(String(seen["egress"]), / 403 /, "the agent could not reach an off-list host");
assert.ok(result.egress?.some((r) => r.host === "blocked.invalid" && !r.allowed), "and the attempt is recorded");
assert.equal(seen["vercel"], "", "the deploy token never reached the agent");
assert.equal(seen["ordinary"], "ordinary file\n", "ordinary files stay readable");

const sandbox = detectSandbox();
assert.equal(result.sandbox?.backend, sandbox.backend, "the node records how it was confined");
if (sandbox.backend === "bwrap") {
  assert.equal(executor.capabilities.sandboxed, true);
  // Masked with /dev/null on a nodev mount: the open is refused (EACCES) or reads empty.
  assert.doesNotMatch(String(seen["worktreeEnv"]), /SECRET/, `the worktree's .env leaked: ${String(seen["worktreeEnv"])}`);
  assert.doesNotMatch(String(seen["repoEnv"]), /SECRET/, `the real checkout's .env leaked: ${String(seen["repoEnv"])}`);
  assert.equal(seen["repoEnv"], "ERR:ENOENT", "the real checkout is hidden, not merely masked");
  console.log("sandbox check passed (bubblewrap: .env unreadable in worktree and checkout; egress refused and recorded)");
} else {
  assert.equal(executor.capabilities.sandboxed, false, "an unsandboxed executor must not claim otherwise");
  console.log(`sandbox check passed — FS enforcement NOT proven here: ${sandbox.detail}. Deny rules, egress and env scrub verified.`);
}

await harness.discardAll();
rmSync(repo, { recursive: true, force: true });
