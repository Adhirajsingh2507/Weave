// ponytail: gated deployment — approving pre-release runs the RELEASE node via a deployer.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "./api.js";
import { realise } from "./testing.js";
import { GitHarness } from "./runtime.js";
import { FakeDeployer, VercelDeployer } from "./deploy.js";
import type { Deployer } from "./deploy.js";
import { GraphStore } from "./store/graph-store.js";
import type { ExecInput, ExecResult, NodeExecutor } from "./runtime.js";
import type { Verifier } from "./loop.js";

const git = (a: string[], cwd: string): string => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();

const repo = mkdtempSync(join(tmpdir(), "weave-deploy-"));
git(["init", "-q"], repo);
git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
git(["config", "user.email", "t@w.local"], repo);
git(["config", "user.name", "W"], repo);
writeFileSync(join(repo, "README.md"), "# t\n");
git(["add", "-A"], repo);
git(["commit", "-q", "-m", "init"], repo);

const executor: NodeExecutor = {
  name: "w",
  async run(input: ExecInput): Promise<ExecResult> {
    return realise(input);
  },
};
const verifier: Verifier = {
  async verify(dir) {
    return { ok: git(["status", "--porcelain"], dir).length > 0, evidence: [] };
  },
};

const engine = new Engine({
  repoPath: repo,
  deps: {
    executor,
    verifier,
    makeHarness: (p) => new GitHarness(p), defaultPacks: [],
    deployer: new FakeDeployer("https://weave.example/deploy-123"),
  },
});
let deployUrl: unknown;
engine.events.subscribe((e) => {
  if (e.type === "deployment.completed") deployUrl = e.data?.["url"];
});

await engine.init("new");
const h = await engine.run({ text: "component: hero section" });

let gates = await engine.listGates();
await engine.resolveGate(gates[0]!.id, "approve"); // design → execute → pre-release
gates = await engine.listGates();
assert.equal(gates[0]!.kind, "pre-release");

await engine.resolveGate(gates[0]!.id, "approve"); // triggers deploy
const rel = (await engine.getExecGraph(h.runId)).find((n) => n.kind === "release");
assert.equal(rel?.status, "complete", "release node deployed");
assert.equal((await engine.getRun(h.runId))?.status, "done");
assert.equal(deployUrl, "https://weave.example/deploy-123");

rmSync(repo, { recursive: true, force: true });

// ── Deploy evidence + post-deploy checks against a live URL ───
// A local server stands in for the host: it serves the built site with some security headers
// and not others, so the live checks have to tell the two apart.
{
  const repo2 = mkdtempSync(join(tmpdir(), "weave-deploy-live-"));
  git(["init", "-q"], repo2);
  git(["symbolic-ref", "HEAD", "refs/heads/main"], repo2);
  git(["config", "user.email", "t@w.local"], repo2);
  git(["config", "user.name", "W"], repo2);
  writeFileSync(join(repo2, "README.md"), "# t\n");
  git(["add", "-A"], repo2);
  git(["commit", "-q", "-m", "init"], repo2);

  const host = createServer((req, res) => {
    const file = join(repo2, "dist", req.url === "/" ? "index.html" : (req.url ?? "").slice(1));
    if (!existsSync(file)) return void res.writeHead(404).end();
    res.writeHead(200, { "content-type": "text/html", "x-content-type-options": "nosniff", "x-frame-options": "DENY" });
    res.end(readFileSync(file));
  });
  await new Promise<void>((r) => host.listen(0, "127.0.0.1", r));
  const addr = host.address();
  const liveUrl = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;

  // The deployer "publishes" by building dist/, which the stand-in host then serves.
  let deployedCommit: string | undefined;
  const deployer: Deployer = {
    async deploy(path, ctx) {
      deployedCommit = ctx?.commit;
      execFileSync("pnpm", ["-s", "build"], { cwd: path });
      return { ok: true, url: liveUrl, log: `published ${ctx?.commit ?? ""}` };
    },
  };
  const live = new Engine({
    repoPath: repo2,
    deps: { executor: { name: "r", run: async (input) => realise(input) }, makeHarness: (p) => new GitHarness(p), deployer },
  });
  await live.init("new");
  const run2 = await live.run({ projectName: "Live", text: "component: hero section" });
  await live.resolveGate((await live.listGates())[0]!.id, "approve");
  const pre = (await live.listGates())[0]!;
  assert.equal(pre.kind, "pre-release");
  const head = git(["rev-parse", "HEAD"], repo2);
  await live.resolveGate(pre.id, "approve");
  host.close();

  assert.equal(deployedCommit, head, "the deployer is told which commit it releases");
  const rows = new GraphStore(join(repo2, ".agent", "state.db")).evidenceFor({ runId: run2.runId }).filter((r) => r.node_id === "release");
  const deployRow = rows.find((r) => r.kind === "deploy" && /^deployed /.test(r.detail));
  assert.ok(deployRow, "deployment evidence exists");
  assert.match(deployRow!.detail, new RegExp(`deployed ${head.slice(0, 7)} to ${liveUrl.replace(/\./g, "\\.")}`), "it records the commit and the URL");
  assert.ok(deployRow!.artifact_path && existsSync(deployRow!.artifact_path), "the deploy log is kept");

  const report = await live.report(run2.runId);
  const crit = (id: string) => report.requirements.flatMap((r) => r.criteria).find((c) => c.id === id)!;
  assert.equal(crit("crit:sec.headers.nosniff").status, "passed", "a header the host sends passes live");
  assert.equal(crit("crit:sec.headers.hsts").status, "failed", "a header it does not send fails live");
  assert.match(crit("crit:sec.headers.hsts").evidence.at(-1)!.detail, /^\[live http:\/\/127\.0\.0\.1:\d+\] .* sends no strict-transport-security header/);
  assert.equal(crit("crit:a11y.lang").evidence.at(-1)!.detail.startsWith("[live "), true, "page checks re-run against the live page");
  assert.ok(rows.some((r) => r.kind === "deploy" && /post-deploy checks against .*: \d+ passed, [1-9]\d* failed/.test(r.detail)), "the summary counts the live failures");
  rmSync(repo2, { recursive: true, force: true });
}

// ── Vercel: the token reaches the vercel CLI through its environment, never argv ──
{
  const dir = mkdtempSync(join(tmpdir(), "weave-vercel-"));
  const bin = join(dir, "vercel");
  writeFileSync(
    bin,
    `#!/usr/bin/env node
require("node:fs").writeFileSync(${JSON.stringify(join(dir, "seen.json"))}, JSON.stringify({ argv: process.argv.slice(2), token: process.env.VERCEL_TOKEN || "", aws: process.env.AWS_SECRET_ACCESS_KEY || "" }));
console.log("Inspect: https://vercel.com/team/site/abc");
console.log("Production: https://site-abc123-team.vercel.app");
if (process.argv.includes("--prod")) console.log("▲ Aliased         https://site.vercel.app");
console.log("- Check the deployment response:\\n  vercel curl https://site-abc123-team.vercel.app --project site");
`,
  );
  chmodSync(bin, 0o755);
  process.env["AWS_SECRET_ACCESS_KEY"] = "unrelated-secret";
  const res = await new VercelDeployer({ token: "tok-123", bin, build: false, prod: true, project: "weave-robotics-demo" }).deploy(dir);
  delete process.env["AWS_SECRET_ACCESS_KEY"];
  const seen = JSON.parse(readFileSync(join(dir, "seen.json"), "utf8")) as { argv: string[]; token: string; aws: string };
  assert.ok(res.ok);
  assert.equal(res.url, "https://site.vercel.app", "the public alias — the per-deployment URL is behind Vercel's login");
  const preview = await new VercelDeployer({ token: "tok-123", bin, build: false }).deploy(dir);
  assert.equal(preview.url, "https://site-abc123-team.vercel.app", "a preview has no alias: the deployment URL, not the inspect link");
  assert.deepEqual(seen.argv, ["deploy", "dist", "--yes", "--project", "weave-robotics-demo", "--prod"], "the named project, not one called after the folder");
  assert.equal(seen.token, "tok-123", "the token is in the release step's environment");
  assert.ok(!seen.argv.join(" ").includes("tok-123"), "and never on the command line");
  assert.equal(seen.aws, "", "nothing else from the engine's environment leaks into the deploy");
  rmSync(dir, { recursive: true, force: true });
}

console.log("deploy (gated release, deploy evidence, post-deploy checks against the live URL, secret only in the release env) check passed");
