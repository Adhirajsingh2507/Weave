// ponytail: V2.6 — screenshot and URL intake, with a recorded vision reading so the check is
// deterministic (live vision belongs to the demo, never to a check).
//   1. exact readings are accepted; fuzzy ones and an auto-chosen style open a low-confidence
//      gate that names each field — nothing is guessed silently;
//   2. with a decision provider, normalising earns confidence and lands in the corpus;
//   3. explicit text always wins over a reading;
//   4. a URL is read deterministically, with provenance;
//   5. the exit criterion: a screenshot plus two sentences produces a valid IR and a styled build.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Engine } from "./api.js";
import { FakeDecision } from "./decision/providers.js";
import { GUIDE_DIR } from "./design/style.js";
import { RecordedVisionInterpreter, compileMultimodal, uncertain } from "./intake.js";
import type { VisionFacts } from "./intake.js";
import { realise } from "./testing.js";
import { GitHarness } from "./runtime.js";
import type { DesignIR } from "./ir/schema.js";

const git = (a: string[], cwd: string): string => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();

// A real image, so paths and provenance are real; the reading itself is recorded.
const pictures = join(GUIDE_DIR, "..", "demo-design", "minimalism");
const screenshot = join(pictures, readdirSync(pictures).find((f) => /\.(png|jpe?g|webp)$/i.test(f))!);

const reading: VisionFacts = {
  projectName: "Atlas Robotics",
  mood: "precise dark techno",
  sections: [
    { id: "nav", name: "Navigation", kind: "nav" },
    { id: "hero", name: "Hero", kind: "section" },
    { id: "features", name: "Features", kind: "section" },
    { id: "cta", name: "Book a demo", kind: "section" },
  ],
  fields: {
    colorMode: "dark",
    layoutSystem: "asymmetric-ish, a split hero", // two categories at once: ambiguous
    layoutDensity: "airy and spacious", // one category inside prose: plausible, not certain
    typographyScale: "display",
  },
  styleHints: ["robotics", "hardware", "launch"],
};
const vision = new RecordedVisionInterpreter(reading);
const field = (ir: DesignIR, f: string) => ir.meta.interpretations!.find((i) => i.field === f)!;

// ── 1. Deterministic normalising: exact accepted, fuzzy gated ──
{
  const ir = await compileMultimodal({ screenshots: [screenshot] }, { vision });
  assert.equal(ir.colors.mode, "dark");
  assert.equal(field(ir, "colors.mode").escalation, "accept", "an exact reading is accepted");
  assert.equal(field(ir, "typography.scale").escalation, "accept");
  assert.equal(field(ir, "layout.system").escalation, "human", "two categories at once is not guessed");
  assert.equal(field(ir, "layout.density").value, "spacious");
  assert.notEqual(field(ir, "layout.density").escalation, "accept", "a category found in prose is not certain");
  assert.deepEqual(ir.components.map((c) => c.id), ["nav", "hero", "features", "cta"], "structure comes from the reading");
  assert.deepEqual(ir.provenance["hero"], [{ kind: "screenshot", ref: screenshot }], "with provenance");
  assert.equal(ir.meta.projectName, "Atlas Robotics");
  assert.equal(ir.meta.style, "futuristic", "a style is suggested from what was read");
  assert.equal(field(ir, "meta.style").escalation, "human", "and a chosen style is always confirmed by a person");
  assert.ok(field(ir, "meta.style").alternatives!.length > 0, "with the alternatives offered");
  assert.ok(ir.designTokens?.shape, "the suggested style's tokens are in the IR");
  assert.deepEqual(uncertain(ir).map((i) => i.field).sort(), ["layout.density", "layout.system", "meta.style"]);
}

// ── 2. A decision provider earns confidence, and every verdict is on the record ──
{
  const corpus = join(mkdtempSync(join(tmpdir(), "weave-intake-corpus-")), "decisions.jsonl");
  const decision = new FakeDecision((req) => {
    const state = req.state as { field: string };
    return { value: state.field === "layout.system" ? "split" : req.candidates![req.candidates!.length - 1]!, confidence: 0.93 };
  });
  const ir = await compileMultimodal({ screenshots: [screenshot] }, { vision, decision, corpusPath: corpus });
  assert.equal(ir.layout.system, "split");
  assert.equal(field(ir, "layout.system").escalation, "accept", "a confident normalisation is accepted");
  assert.deepEqual(uncertain(ir).map((i) => i.field), ["meta.style"], "only the style still needs a person");
  const entries = readFileSync(corpus, "utf8").trim().split("\n").map((l) => JSON.parse(l) as { name: string });
  assert.equal(entries.length, 4, "one corpus entry per field");
  assert.ok(entries.every((e) => e.name === "interpret.normalizeField"));
}

// ── 3. Text wins ──
{
  const ir = await compileMultimodal(
    { screenshots: [screenshot], text: "style: brutalism\ncomponent: hero section" },
    { vision },
  );
  assert.equal(ir.meta.style, "brutalism", "a style the author named is not second-guessed");
  assert.ok(!ir.meta.interpretations!.some((i) => i.field === "meta.style"));
  assert.equal(ir.components.filter((c) => c.id === "hero").length, 1, "a section the text named is not duplicated");
}

// ── 4. URL intake ──
{
  const site = createServer((_req, res) =>
    res.end(`<!doctype html><html><head><title>Northwind Hardware</title></head><body>
      <header><nav>…</nav></header>
      <section id="launch"><h2>Launch</h2></section>
      <section><h2>Pricing Plans</h2></section>
      <footer>© Northwind</footer></body></html>`),
  );
  await new Promise<void>((r) => site.listen(0, "127.0.0.1", r));
  const addr = site.address();
  const url = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}/`;
  const ir = await compileMultimodal({ url }, {});
  site.close();
  assert.equal(ir.meta.projectName, "Northwind Hardware");
  assert.deepEqual(ir.components.map((c) => c.id), ["nav", "launch", "pricing-plans", "footer"]);
  assert.deepEqual(ir.provenance["launch"], [{ kind: "url", ref: url }]);
  assert.ok(ir.meta.sourceInputs.some((s) => s.kind === "url"));
}

// ── 5. A screenshot and two sentences → a gated intake → a styled build ──
{
  const repo = mkdtempSync(join(tmpdir(), "weave-intake-"));
  git(["init", "-q"], repo);
  git(["symbolic-ref", "HEAD", "refs/heads/main"], repo);
  git(["config", "user.email", "t@w.local"], repo);
  git(["config", "user.name", "W"], repo);
  writeFileSync(join(repo, "README.md"), "# t\n");
  git(["add", "-A"], repo);
  git(["commit", "-q", "-m", "init"], repo);

  const briefs: string[] = [];
  const engine = new Engine({
    repoPath: repo,
    deps: {
      vision,
      executor: {
        name: "r",
        run: async (input) => {
          briefs.push(input.contextPack.constraints.join("\n"));
          return realise(input);
        },
      },
      makeHarness: (p) => new GitHarness(p),
      concurrency: 4,
    },
  });
  await engine.init("new");
  const { runId } = await engine.run({
    screenshots: [screenshot],
    text: "Atlas builds humanoid robots for warehouses. The page should get engineers to book a demo.",
  });
  const gate = (await engine.listGates())[0]!;
  assert.equal(gate.kind, "low-confidence", "uncertain readings gate the intake");
  assert.match(gate.summary, /3 reading\(s\) need confirming/);
  assert.ok(gate.evidenceRefs.some((r) => /^layout\.system: read "asymmetric-ish, a split hero" as \w+ \(confidence 0\.20\)/.test(r)), "each is named with what was read");
  assert.ok(gate.evidenceRefs.some((r) => /^meta\.style: .* as futuristic .*alternatives/.test(r)));

  const stored = JSON.parse(readFileSync(join(repo, ".agent", "project", `ir-${runId}.json`), "utf8")) as DesignIR;
  assert.equal(stored.meta.interpretations?.length, 5, "the interpretations persist with the canonical IR");

  await engine.resolveGate(gate.id, "approve", "futuristic is right; split hero");
  const next = (await engine.listGates())[0]!;
  assert.equal(next.kind, "pre-release", `the build should reach pre-release, got ${next.kind}: ${next.summary}`);
  const tokens = readFileSync(join(repo, "styles", "tokens.css"), "utf8");
  assert.match(tokens, /Futuristic/, "styled with the confirmed guide");
  assert.ok(existsSync(join(repo, "sections", "hero.html")), "built from the reading's structure");
  // A reference is read for its design, not its words or brand (decision #86): every agent is told.
  assert.ok(briefs.length > 0 && briefs.every((b) => /reference website for layout and style only\. Write original copy/.test(b)));
  rmSync(repo, { recursive: true, force: true });
}

console.log("intake vision check passed (exact accepted, fuzzy gated, text wins, URL read, screenshot + two sentences → styled build)");
