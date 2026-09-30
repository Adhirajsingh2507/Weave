// V2.5 — the static explorer: one self-contained HTML file that tells the whole story of a run.
// intent → design → code → criteria → evidence → commits → gates, the metrics, the DAG as it ran,
// and the failure/repair timeline.
//
// Static on purpose (canonical §94): it opens offline, attaches to a PR, and needs no server. No
// scripts, no fonts, no external references — report-html.check holds it to that. Read-only; it
// stays a report until something forces it to become more.

import type { RunReport } from "./report.js";

const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const pct = (v: number | null): string => (v === null ? "—" : `${Math.round(v * 100)}%`);

const STATUS_CLASS: Record<string, string> = {
  complete: "ok",
  passed: "ok",
  approved: "ok",
  failed: "bad",
  escalated: "bad",
  rejected: "bad",
  blocked: "warn",
  open: "warn",
  running: "warn",
  skipped: "muted",
  pending: "muted",
  "not-applicable": "muted",
  unavailable: "muted",
  human: "warn",
};
const cls = (status: string): string => STATUS_CLASS[status] ?? "muted";

const SYMBOL: Record<string, string> = { passed: "✓", failed: "✗", "not-applicable": "–", unavailable: "?", human: "☐", pending: "·" };

/** Nodes worth drawing, with the implicit order of the fixed tail made explicit. */
function dagNodes(report: RunReport): Array<RunReport["nodes"][number]> {
  const drawn = report.nodes.filter((n) => ["scaffold", "asset", "impl", "integration", "code-qa", "browser-qa", "visual-qa", "repair", "release"].includes(n.kind));
  const has = (id: string): boolean => drawn.some((n) => n.id === id);
  return drawn.map((n) => {
    if (n.kind === "impl" && !n.dependsOn.length && has("scaffold")) return { ...n, dependsOn: ["scaffold"] };
    if (n.kind === "integration" && !n.dependsOn.length) return { ...n, dependsOn: drawn.filter((x) => x.kind === "impl").map((x) => x.id) };
    if (n.kind === "code-qa") return { ...n, dependsOn: has("integration") ? ["integration"] : [] };
    if (n.kind === "repair") return { ...n, dependsOn: has("code-qa") ? ["code-qa"] : [] };
    const afterQa = has("repair:policy") ? "repair:policy" : "code-qa";
    if (n.kind === "browser-qa") return { ...n, dependsOn: has(afterQa) ? [afterQa] : [] };
    if (n.kind === "visual-qa") return { ...n, dependsOn: has("browser-qa") ? ["browser-qa"] : [] };
    if (n.kind === "release") return { ...n, dependsOn: has("visual-qa") ? ["visual-qa"] : has(afterQa) ? [afterQa] : [] };
    return n;
  });
}

/** The DAG as layered boxes: a node's column is one past its deepest dependency. */
function dagSvg(report: RunReport): string {
  const nodes = dagNodes(report);
  if (!nodes.length) return "";
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depth = new Map<string, number>();
  const depthOf = (id: string, seen = new Set<string>()): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const deps = (byId.get(id)?.dependsOn ?? []).filter((d) => byId.has(d));
    const d = deps.length ? Math.max(...deps.map((x) => depthOf(x, seen))) + 1 : 0;
    depth.set(id, d);
    return d;
  };
  nodes.forEach((n) => depthOf(n.id));

  const W = 124;
  const H = 36;
  const GX = 28;
  const GY = 12;
  const cols = new Map<number, string[]>();
  for (const n of nodes) cols.set(depth.get(n.id)!, [...(cols.get(depth.get(n.id)!) ?? []), n.id]);
  const maxRows = Math.max(...[...cols.values()].map((c) => c.length));
  const height = maxRows * (H + GY) + GY;
  const width = cols.size * (W + GX) + GX;
  const pos = new Map<string, { x: number; y: number }>();
  for (const [d, ids] of cols) {
    const offset = (height - ids.length * (H + GY) - GY) / 2;
    ids.forEach((id, i) => pos.set(id, { x: GX / 2 + d * (W + GX), y: offset + GY + i * (H + GY) }));
  }

  const edges = nodes.flatMap((n) =>
    n.dependsOn
      .filter((d) => pos.has(d))
      .map((d) => {
        const a = pos.get(d)!;
        const b = pos.get(n.id)!;
        const x1 = a.x + W;
        const y1 = a.y + H / 2;
        const x2 = b.x;
        const y2 = b.y + H / 2;
        const mx = (x1 + x2) / 2;
        return `<path class="edge" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"/>`;
      }),
  );
  const boxes = nodes.map((n) => {
    const p = pos.get(n.id)!;
    const label = n.id.length > 17 ? `${n.id.slice(0, 16)}…` : n.id;
    const tries = n.attempts && n.attempts > 1 ? ` ×${n.attempts}` : "";
    return (
      `<g class="node ${cls(n.status)}"><title>${esc(`${n.id} — ${n.status}${n.commit ? ` @ ${n.commit.slice(0, 7)}` : ""}`)}</title>` +
      `<rect x="${p.x}" y="${p.y}" width="${W}" height="${H}" rx="6"/>` +
      `<text x="${p.x + 10}" y="${p.y + 15}">${esc(label)}</text>` +
      `<text class="sub" x="${p.x + 10}" y="${p.y + 28}">${esc(n.status)}${esc(tries)}</text></g>`
    );
  });
  return `<svg class="dag" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Execution graph">${edges.join("")}${boxes.join("")}</svg>`;
}

/** Attempts on a shared clock: overlap is parallelism, red bars are the repair trail. */
function timelineSvg(report: RunReport): string {
  const spans = report.attempts
    .filter((a) => a.endedAt)
    .map((a) => ({ ...a, s: Date.parse(a.startedAt), e: Date.parse(a.endedAt!) }));
  if (!spans.length) return "<p class=\"muted\">No attempts recorded.</p>";
  const t0 = Math.min(...spans.map((a) => a.s));
  const t1 = Math.max(...spans.map((a) => a.e));
  const total = Math.max(t1 - t0, 1);
  const rows = [...new Set(spans.map((a) => a.nodeId))];
  const LABEL = 150;
  const PLOT = 620;
  const ROW = 26;
  const height = rows.length * ROW + 28;
  const x = (t: number): number => LABEL + ((t - t0) / total) * PLOT;
  const bars = spans.map((a) => {
    const y = rows.indexOf(a.nodeId) * ROW + 6;
    const w = Math.max(x(a.e) - x(a.s), 2);
    return (
      `<g class="${a.ok ? "ok" : "bad"}"><title>${esc(`${a.nodeId} attempt ${a.attempt}: ${a.ok ? "passed" : "failed"}, ${a.e - a.s}ms`)}</title>` +
      `<rect class="bar" x="${x(a.s)}" y="${y}" width="${w}" height="${ROW - 10}" rx="3"/></g>`
    );
  });
  const labels = rows.map((r, i) => `<text x="0" y="${i * ROW + 19}">${esc(r)}</text>`);
  const axis = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const t = t0 + f * total;
    return `<line class="tick" x1="${x(t)}" y1="0" x2="${x(t)}" y2="${rows.length * ROW}"/><text class="sub" x="${x(t)}" y="${rows.length * ROW + 18}" text-anchor="middle">${Math.round(f * total)}ms</text>`;
  });
  return `<svg class="timeline" viewBox="0 0 ${LABEL + PLOT + 30} ${height}" width="100%" style="min-width:600px" role="img" aria-label="Attempt timeline">${axis.join("")}${labels.join("")}${bars.join("")}</svg>`;
}

function metricTiles(report: RunReport): string {
  const m = report.metrics;
  const tiles: Array<[string, string, string]> = [
    ["Autonomous", m.autonomous ? "yes" : "no", "no gates beyond design approval and pre-release"],
    ["First-pass verification", pct(m.firstPassVerificationRate), "impl nodes that passed on their first attempt"],
    ["Repair success", pct(m.repairSuccessRate), "nodes that failed and then completed"],
    ["Human intervention", pct(m.humanInterventionRate), `${m.unplannedGates} unplanned of ${m.totalGates} gates`],
    ["Evidence coverage", pct(m.evidenceCoverage), "requirements with a passed or failed verdict"],
  ];
  if (report.timing) {
    const { wallMs, serialMs } = report.timing;
    tiles.push(["Impl wall-clock", `${(wallMs / 1000).toFixed(1)}s`, `${(serialMs / 1000).toFixed(1)}s run one at a time`]);
  }
  return tiles
    .map(([label, value, note]) => `<div class="tile"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div><div class="note">${esc(note)}</div></div>`)
    .join("");
}

function requirementRows(report: RunReport): string {
  return report.requirements
    .map((req) => {
      const counts = (s: string): number => req.criteria.filter((c) => c.status === s).length;
      const verdict = counts("failed") ? "failed" : counts("passed") ? "passed" : "pending";
      const criteria = req.criteria
        .map(
          (c) =>
            `<li class="${cls(c.status)}"><span class="sym">${SYMBOL[c.status] ?? "·"}</span> <code>${esc(c.id)}</code>` +
            `${c.severity ? ` <span class="tag">${esc(c.severity)}</span>` : ""} — ${esc(c.evidence.at(-1)?.detail ?? c.rule)}` +
            (c.evidence.length > 1 ? ` <span class="muted">(${c.evidence.length} records)</span>` : "") +
            `</li>`,
        )
        .join("");
      return (
        `<details class="req ${cls(verdict)}"><summary><span class="sym">${SYMBOL[verdict] ?? "·"}</span> ` +
        `<code>${esc(req.id)}</code> <span class="title">${esc(req.title)}</span>` +
        `<span class="counts">${counts("passed")} passed · ${counts("failed")} failed · ${counts("pending") + counts("unavailable")} open</span></summary>` +
        `<dl>` +
        (req.designNodeId ? `<dt>Design</dt><dd><code>${esc(req.designNodeId)}</code></dd>` : "") +
        (req.codeFiles.length ? `<dt>Code</dt><dd>${req.codeFiles.map((f) => `<code>${esc(f)}</code>`).join(" ")}</dd>` : "") +
        (req.commits.length ? `<dt>Commits</dt><dd>${req.commits.map((c) => `<code>${esc(c.slice(0, 7))}</code>`).join(" ")}</dd>` : "") +
        `<dt>Source</dt><dd>${esc(req.source)}</dd></dl><ul class="criteria">${criteria}</ul></details>`
      );
    })
    .join("");
}

function list<T>(items: T[], render: (t: T) => string, empty: string): string {
  return items.length ? `<ul class="plain">${items.map(render).join("")}</ul>` : `<p class="muted">${esc(empty)}</p>`;
}

export function renderExplorer(report: RunReport, opts: { title?: string; generatedAt?: string } = {}): string {
  const title = opts.title ?? "Weave run";
  const covered = report.requirements.filter((r) => r.covered).length;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — ${esc(report.runId)}</title>
<style>
:root {
  --bg: #fbfbfa; --panel: #ffffff; --fg: #1c1d1f; --muted: #6b6f76; --line: #e3e3e0;
  --ok: #1f7a4d; --ok-bg: #e7f4ec; --bad: #b3261e; --bad-bg: #fbe9e7; --warn: #8a5a00; --warn-bg: #fdf1dc;
  --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111214; --panel: #17181b; --fg: #e8e8e6; --muted: #9a9ea6; --line: #2a2c30;
    --ok: #6fd3a0; --ok-bg: #16281f; --bad: #f28b82; --bad-bg: #2e1a19; --warn: #f2c36b; --warn-bg: #2d2415;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 1080px; margin: 0 auto; padding: 32px 16px 64px; }
h1 { font-size: 26px; margin: 0 0 4px; letter-spacing: -0.01em; }
h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin: 40px 0 12px; }
code { font-family: var(--mono); font-size: 0.88em; }
.meta { color: var(--muted); }
.status { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 13px; font-weight: 600; }
.status.ok { background: var(--ok-bg); color: var(--ok); } .status.bad { background: var(--bad-bg); color: var(--bad); }
.status.warn { background: var(--warn-bg); color: var(--warn); } .status.muted { background: var(--line); color: var(--muted); }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
.tile { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; }
.tile .label { font-size: 12px; color: var(--muted); } .tile .value { font-size: 24px; font-weight: 650; margin: 2px 0; }
.tile .note { font-size: 12px; color: var(--muted); }
.scroll { overflow-x: auto; background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 12px; }
svg text { font: 12px system-ui, sans-serif; fill: var(--fg); } svg text.sub { fill: var(--muted); font-size: 11px; }
.dag .edge { fill: none; stroke: var(--line); stroke-width: 1.5; }
.dag rect { fill: var(--panel); stroke: var(--muted); stroke-width: 1; }
.dag .ok rect { stroke: var(--ok); fill: var(--ok-bg); } .dag .bad rect { stroke: var(--bad); fill: var(--bad-bg); }
.dag .warn rect { stroke: var(--warn); fill: var(--warn-bg); } .dag .muted rect { stroke-dasharray: 3 3; }
.timeline .tick { stroke: var(--line); } .timeline .ok .bar { fill: var(--ok); } .timeline .bad .bar { fill: var(--bad); }
details.req { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; margin: 6px 0; }
details.req > summary { cursor: pointer; padding: 10px 14px; display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
details.req .title { flex: 1 1 240px; } details.req .counts { color: var(--muted); font-size: 13px; }
details.req dl { display: grid; grid-template-columns: 90px 1fr; gap: 4px 12px; margin: 0; padding: 0 14px 8px; font-size: 14px; }
details.req dt { color: var(--muted); } details.req dd { margin: 0; overflow-wrap: anywhere; }
ul.criteria { margin: 0; padding: 0 14px 12px 34px; font-size: 14px; } ul.criteria li { margin: 3px 0; overflow-wrap: anywhere; }
.sym { font-weight: 700; } .ok > .sym, li.ok .sym, .ok > summary .sym { color: var(--ok); }
.bad > .sym, li.bad .sym, .bad > summary .sym { color: var(--bad); } li.warn .sym, .warn > summary .sym { color: var(--warn); }
.tag { font-size: 11px; border: 1px solid var(--line); border-radius: 4px; padding: 0 4px; color: var(--muted); }
ul.plain { list-style: none; margin: 0; padding: 0; } ul.plain li { padding: 6px 0; border-bottom: 1px solid var(--line); overflow-wrap: anywhere; }
.muted { color: var(--muted); } .legend { font-size: 13px; color: var(--muted); margin-top: 8px; }
</style>
</head>
<body>
<main>
<h1>${esc(title)}</h1>
<p class="meta"><code>${esc(report.runId)}</code> · <span class="status ${cls(report.status === "done" ? "complete" : report.status === "failed" ? "failed" : "open")}">${esc(report.status)}</span>
 · started ${esc(report.startedAt)}${report.endedAt ? ` · ended ${esc(report.endedAt)}` : ""}${opts.generatedAt ? ` · generated ${esc(opts.generatedAt)}` : ""}</p>

<h2>Outcome</h2>
<div class="tiles">${metricTiles(report)}</div>

<h2>How the work ran</h2>
<div class="scroll">${dagSvg(report)}</div>
<p class="legend">Each column waits for the one before it. Green completed, red escalated, amber held behind a gate, dashed never ran.</p>
<div class="scroll">${timelineSvg(report)}</div>
<p class="legend">Every attempt on one clock: overlapping bars ran in parallel; red bars failed verification and were repaired or escalated.</p>

<h2>Requirements — ${covered} of ${report.requirements.length} with a verdict</h2>
${requirementRows(report)}

<h2>Repair trail</h2>
${list(report.nodeFailures, (f) => `<li><code>${esc(f.nodeId)}</code> — ${esc(f.detail)}</li>`, "No node check failed.")}

<h2>Gates</h2>
${list(report.gates, (g) => `<li><span class="status ${cls(g.status)}">${esc(g.status)}</span> <code>${esc(g.kind)}</code>${g.notes ? ` — “${esc(g.notes)}”` : ""}</li>`, "No gates.")}

<h2>Boundaries</h2>
${list(report.boundaries, (b) => `<li class="${b.ok ? "" : "bad"}"><code>${esc(b.nodeId)}</code> <span class="tag">${esc(b.kind)}</span> ${esc(b.detail)}</li>`, "No sandbox, network or risk records — the executor reported none.")}

${report.orphanCode.length ? `<h2>Orphan code</h2><p>${report.orphanCode.length} file(s) map to no design element.</p>` : ""}
</main>
</body>
</html>
`;
}
