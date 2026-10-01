// D5 — what a run cost, measured from what it recorded: wall time, agent sessions and retries,
// agent tokens (from each session's transcript), decision calls with their tokens and the plan's
// cost-equivalent (from `claude -p`), and the owner's typed interventions. Nothing is estimated.

import { existsSync, readFileSync } from "node:fs";
import type { GraphStore } from "./store/graph-store.js";

export interface RunUsage {
  runId: string;
  wallClockMs: number | null;
  agentSessions: number;
  attempts: number;
  retries: number;
  interventions: number;
  agentTokens: { input: number; output: number; cacheRead: number; cacheWrite: number; turns: number };
  decisions: { calls: number; byName: Record<string, number>; input: number; output: number; costUsd: number; models: string[] };
  /** Visual-QA judgements made (each is a vision read plus a decision). */
  visualChecks: number;
}

const num = (s: string, key: string): number => Number(new RegExp(`${key}=(\\d+)`).exec(s)?.[1] ?? 0);

export function runUsage(store: GraphStore, runId: string, corpusPath: string): RunUsage {
  const run = store.getRun(runId);
  const attempts = store.attemptsFor(runId);
  const evidence = store.evidenceFor({ runId });

  // A session's transcript is cumulative, so its last usage line is its total.
  const lastUsage = new Map<string, string>();
  for (const e of evidence) if (e.kind === "agent" && e.detail.startsWith("usage:") && e.node_id) lastUsage.set(e.node_id, e.detail);
  const agentTokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, turns: 0 };
  for (const d of lastUsage.values()) {
    agentTokens.input += num(d, "input");
    agentTokens.output += num(d, "output");
    agentTokens.cacheRead += num(d, "cacheRead");
    agentTokens.cacheWrite += num(d, "cacheWrite");
    agentTokens.turns += num(d, "turns");
  }

  const start = run ? Date.parse(run.startedAt) : 0;
  const ends = [...attempts.map((a) => a.ended_at ?? a.started_at), ...evidence.map((e) => e.ts)].map((t) => Date.parse(t)).filter(Number.isFinite);
  const end = ends.length ? Math.max(...ends) : 0;

  const decisions = { calls: 0, byName: {} as Record<string, number>, input: 0, output: 0, costUsd: 0, models: [] as string[] };
  if (existsSync(corpusPath)) {
    for (const line of readFileSync(corpusPath, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const e = JSON.parse(line) as { ts: string; name: string; model?: string; usage?: { input?: number; output?: number; costUsd?: number } };
      const t = Date.parse(e.ts);
      if (t < start || (end && t > end + 60_000)) continue;
      decisions.calls++;
      decisions.byName[e.name] = (decisions.byName[e.name] ?? 0) + 1;
      decisions.input += e.usage?.input ?? 0;
      decisions.output += e.usage?.output ?? 0;
      decisions.costUsd += e.usage?.costUsd ?? 0;
      if (e.model && !decisions.models.includes(e.model)) decisions.models.push(e.model);
    }
  }
  const nodes = new Set(attempts.map((a) => a.node_id));
  return {
    runId,
    wallClockMs: start && end ? end - start : null,
    agentSessions: nodes.size,
    attempts: attempts.length,
    retries: attempts.length - nodes.size,
    interventions: evidence.filter((e) => e.kind === "intervention").length,
    agentTokens,
    decisions: { ...decisions, costUsd: Number(decisions.costUsd.toFixed(4)) },
    visualChecks: evidence.filter((e) => e.criterion_id?.endsWith(".asset-visible") && e.status !== "unavailable").length,
  };
}

export function renderUsage(u: RunUsage): string {
  const k = (n: number): string => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
  return [
    `Run ${u.runId}`,
    `  wall clock          ${u.wallClockMs === null ? "n/a" : `${(u.wallClockMs / 60_000).toFixed(1)} min`}`,
    `  agent sessions      ${u.agentSessions} (${u.attempts} attempts, ${u.retries} retries)`,
    `  interventions       ${u.interventions} typed by the owner`,
    `  agent tokens        in ${k(u.agentTokens.input)} · out ${k(u.agentTokens.output)} · cache read ${k(u.agentTokens.cacheRead)} · cache write ${k(u.agentTokens.cacheWrite)} · ${u.agentTokens.turns} model turns`,
    `  decision calls      ${u.decisions.calls} (${Object.entries(u.decisions.byName).map(([n, c]) => `${n} ×${c}`).join(", ") || "none"}) on ${u.decisions.models.join(", ") || "—"}`,
    `  decision tokens     in ${k(u.decisions.input)} · out ${k(u.decisions.output)} · API-price equivalent $${u.decisions.costUsd.toFixed(2)} (not billed on a subscription)`,
    `  visual QA judged    ${u.visualChecks}`,
  ].join("\n");
}
