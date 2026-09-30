#!/usr/bin/env node
// CLI — the first adapter over the headless core (decision #19). Thin mapping to Engine.

import { parseArgs } from "node:util";
import { readFileSync, writeFileSync } from "node:fs";
import { Engine, adapterDeps } from "../core/api.js";
import { detectSandbox } from "../core/sandbox.js";
import { doctor, renderDoctor } from "../core/doctor.js";
import { renderReport } from "../core/report.js";
import { DEFAULT_PACKS, listPacks, loadPack } from "../core/packs/load.js";
import type { MultimodalInput } from "../core/intake.js";
import { listStyles, loadStyle, suggestStyles } from "../core/design/style.js";
import type { GateDecision, ProjectMode } from "../core/types.js";

const HELP = `weave <command>

  init [--mode new|existing]      create the .agent/ workspace
  run [--brief f | --ir f.json] [--name n]   intake+plan → design-approval gate
      [--screenshot img]… [--url u]           read a design from screenshots or a live page
      [--assets dir]…                          where asset files (models, images) come from
  styles [--suggest "brief"]      list the 91 design guides, or suggest three for a brief
  ingest [--changed]              sweep the repo → code graph (tree-sitter)
  map                             infer code→design mappings (needs a decision provider)
  status                          show project status
  graph                           show gaps (unrealized-design + orphan-code)
  report [--json] [--run <id>]    traceability: requirement → code → evidence, plus metrics
  report --html <file>            the explorer: the whole run as one self-contained HTML file
  metrics [--json]                the five metrics for the latest run and the project
  packs [name]                    list policy packs, or show one pack's items
  gates [--all] [--run <id>]      list open gates (latest run unless --all)
  approve <id> [--notes ...]      resolve a gate (approve; resumes execution)
  reject  <id> [--notes ...]      resolve a gate (reject; fails the run)
  watch                           tail the event stream
  sandbox                         show how agents are confined on this machine
  doctor [--offline]              can this machine run the real demo? (one real model call)

  --repo <path>                   target repo (default: cwd)
  --concurrency <n>               impl nodes per batch (default 1)

Environment:
  WEAVE_MODE=api                  API mode: agents and decisions on ANTHROPIC_API_KEY, billed
                                  per token (default: subscription, the claude login)
  WEAVE_DEPLOY=vercel             approving pre-release deploys with Vercel (VERCEL_TOKEN,
                                  or the vercel CLI login; WEAVE_DEPLOY_PROD=1 for production)`;

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      mode: { type: "string", default: "new" },
      repo: { type: "string" },
      notes: { type: "string" },
      brief: { type: "string" },
      ir: { type: "string" },
      name: { type: "string" },
      changed: { type: "boolean" },
      json: { type: "boolean" },
      run: { type: "string" },
      concurrency: { type: "string" },
      all: { type: "boolean" },
      screenshot: { type: "string", multiple: true },
      url: { type: "string" },
      suggest: { type: "string" },
      assets: { type: "string", multiple: true },
      html: { type: "string" },
      offline: { type: "boolean" },
    },
  });

  const cmd = positionals[0] ?? "help";
  const repoPath = values.repo ?? process.cwd();
  const concurrency = values.concurrency ? Number(values.concurrency) : undefined;
  const engine = new Engine({
    repoPath,
    deps: {
      ...adapterDeps(),
      ...(concurrency && concurrency > 0 ? { concurrency } : {}),
      ...(values.assets?.length ? { assetFolders: values.assets } : {}),
    },
  });

  switch (cmd) {
    case "styles": {
      if (values.suggest) {
        for (const s of suggestStyles(values.suggest)) console.log(`${s.slug.padEnd(28)} ${s.score}  ${s.reasons.join("; ")}`);
        break;
      }
      for (const slug of listStyles()) {
        const g = loadStyle(slug);
        console.log(`${slug.padEnd(28)} ${g.summary}`);
      }
      break;
    }
    case "doctor": {
      const rows = await doctor({ offline: values.offline });
      console.log(renderDoctor(rows));
      if (rows.some((r) => r.status === "fail")) process.exitCode = 1;
      break;
    }
    case "sandbox": {
      const sb = detectSandbox();
      console.log(`${sb.backend}: ${sb.detail}`);
      break;
    }
    case "init": {
      const res = await engine.init((values.mode as ProjectMode) ?? "new");
      console.log(`Initialized ${res.agentDir} (mode: ${res.mode})`);
      break;
    }
    case "ingest":
      console.log(JSON.stringify(await engine.ingest({ changedOnly: values.changed }), null, 2));
      break;
    case "map":
      console.log(JSON.stringify(await engine.inferMappings(), null, 2));
      break;
    case "status":
      console.log(JSON.stringify(await engine.status(), null, 2));
      break;
    case "gates":
      console.log(JSON.stringify(await engine.listGates({ ...(values.run ? { runId: values.run } : {}), all: values.all }), null, 2));
      break;
    case "watch": {
      console.log("watching events (Ctrl+C to stop)…");
      engine.events.subscribe((e) =>
        console.log(`${e.ts} ${e.type} ${JSON.stringify(e.data ?? {})}`),
      );
      await new Promise<void>(() => {}); // keep the process alive
      break;
    }
    case "approve":
    case "reject": {
      const id = positionals[1];
      if (!id) {
        console.error(`${cmd}: missing <id>`);
        process.exitCode = 2;
        break;
      }
      await engine.resolveGate(id, cmd as GateDecision, values.notes);
      break;
    }
    case "report": {
      if (values.html) {
        writeFileSync(values.html, await engine.reportHtml(values.run), "utf8");
        console.log(`wrote ${values.html}`);
        break;
      }
      const report = await engine.report(values.run);
      console.log(values.json ? JSON.stringify(report, null, 2) : renderReport(report));
      break;
    }
    case "metrics": {
      const [run, project] = [await engine.metrics(values.run), await engine.projectMetrics()];
      console.log(JSON.stringify({ run, project: { runs: project.runs, autonomousCompletionRate: project.autonomousCompletionRate } }, null, 2));
      break;
    }
    case "packs": {
      const name = positionals[1];
      if (name) {
        const pack = loadPack(name);
        console.log(`${pack.title} (${pack.name}) — ${pack.items.length} items\n${pack.summary}\n`);
        for (const item of pack.items) {
          const scope = item.appliesWhen?.length ? ` [when ${item.appliesWhen.join(", ")}]` : "";
          console.log(`  ${item.severity === "blocking" ? "!" : "·"} ${item.id} (${item.runner})${scope}`);
          console.log(`      ${item.requirement}`);
        }
      } else {
        for (const p of listPacks()) {
          const pack = loadPack(p);
          const on = DEFAULT_PACKS.includes(p) ? " (on by default)" : "";
          console.log(`${pack.name}${on} — ${pack.items.length} items — ${pack.title}`);
        }
      }
      break;
    }
    case "graph":
      console.log(JSON.stringify(await engine.gaps(), null, 2));
      break;
    case "run": {
      const input: MultimodalInput = {};
      if (values.name) input.projectName = values.name;
      if (values.ir) input.ir = JSON.parse(readFileSync(values.ir, "utf8"));
      else if (values.brief) input.text = readFileSync(values.brief, "utf8");
      if (values.screenshot?.length) input.screenshots = values.screenshot;
      if (values.url) input.url = values.url;
      console.log(JSON.stringify(await engine.run(input), null, 2));
      break;
    }
    default:
      console.log(HELP);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
