#!/usr/bin/env node
// CLI — the first adapter over the headless core (decision #19). Thin mapping to Engine.

import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import { Engine } from "../core/api.js";
import type { BriefInput } from "../core/compiler.js";
import type { GateDecision, ProjectMode } from "../core/types.js";

const HELP = `weave <command>

  init [--mode new|existing]      create the .agent/ workspace
  run [--brief f | --ir f.json] [--name n]   intake+plan → design-approval gate
  ingest [--changed]              sweep the repo → code graph (tree-sitter)
  map                             infer code→design mappings (needs a decision provider)
  status                          show project status
  graph                           show gaps (unrealized-design + orphan-code)
  gates                           list open human gates
  approve <id> [--notes ...]      resolve a gate (approve; resumes execution)
  reject  <id> [--notes ...]      resolve a gate (reject; fails the run)
  watch                           tail the event stream

  --repo <path>                   target repo (default: cwd)`;

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
    },
  });

  const cmd = positionals[0] ?? "help";
  const repoPath = values.repo ?? process.cwd();
  const engine = new Engine({ repoPath });

  switch (cmd) {
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
      console.log(JSON.stringify(await engine.listGates(), null, 2));
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
    case "graph":
      console.log(JSON.stringify(await engine.gaps(), null, 2));
      break;
    case "run": {
      const input: BriefInput = {};
      if (values.name) input.projectName = values.name;
      if (values.ir) input.ir = JSON.parse(readFileSync(values.ir, "utf8"));
      else if (values.brief) input.text = readFileSync(values.brief, "utf8");
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
