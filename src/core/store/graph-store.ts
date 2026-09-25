// Phase 2 — SQLite state store (decision #21, better-sqlite3).
// Owns the single .agent/state.db connection: knowledge graph (kg_nodes/edges),
// execution graph (exec_nodes) and run state (runs). One DB, distinct kinds.

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { computeGaps } from "../graph/project.js";
import type { DesignGraph, Gaps } from "../graph/project.js";
import type { Edge, ExecNode, KgNode, KgNodeKind, MappingProvenance } from "../graph/types.js";
import type { Gate, GateStatus, NodeId, RunRecord } from "../types.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS kg_nodes (
  id    TEXT PRIMARY KEY,
  kind  TEXT NOT NULL,
  name  TEXT NOT NULL,
  attrs TEXT
);
CREATE TABLE IF NOT EXISTS edges (
  "from"     TEXT NOT NULL,
  "to"       TEXT NOT NULL,
  kind       TEXT NOT NULL,
  confidence REAL,
  provenance TEXT,
  ts         TEXT,
  PRIMARY KEY ("from", "to", kind)
);
CREATE TABLE IF NOT EXISTS runs (
  id             TEXT PRIMARY KEY,
  status         TEXT NOT NULL,
  started_at     TEXT NOT NULL,
  ended_at       TEXT,
  cursor         TEXT,
  budget_used    INTEGER NOT NULL DEFAULT 0,
  -- Harness state. Without these a second process cannot finish or cancel a run,
  -- and the user is left on the working branch with their work in a stash.
  working_branch TEXT,
  base_branch    TEXT,
  stashed        INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS exec_nodes (
  run_id         TEXT NOT NULL,
  id             TEXT NOT NULL,
  kind           TEXT NOT NULL,
  design_node_id TEXT,
  status         TEXT NOT NULL,
  "commit"       TEXT,
  -- Evidence and attempt count kept per node, so a passing node records why it
  -- passed rather than discarding it the moment the commit lands.
  evidence       TEXT,
  attempts       INTEGER,
  PRIMARY KEY (run_id, id)
);
-- Typed evidence, replacing the string arrays that used to be thrown away on success.
-- Artefacts (logs, screenshots) live on disk under .agent/evidence; rows hold the path.
CREATE TABLE IF NOT EXISTS evidence (
  id            TEXT PRIMARY KEY,
  run_id        TEXT NOT NULL,
  node_id       TEXT,
  criterion_id  TEXT,
  kind          TEXT NOT NULL,
  ok            INTEGER NOT NULL,
  -- pass | fail | not-applicable | unavailable | human. The ok column stays for cheap
  -- filtering; status is what the report shows, because not-applicable is not a pass.
  status        TEXT NOT NULL DEFAULT 'pass',
  detail        TEXT NOT NULL,
  artifact_path TEXT,
  ts            TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS evidence_run ON evidence (run_id);
CREATE INDEX IF NOT EXISTS evidence_criterion ON evidence (criterion_id);

-- One row per attempt, so first-pass and repair rates are measured rather than inferred.
CREATE TABLE IF NOT EXISTS attempts (
  run_id     TEXT NOT NULL,
  node_id    TEXT NOT NULL,
  attempt    INTEGER NOT NULL,
  executor   TEXT,
  exec_ok    INTEGER NOT NULL,
  verify_ok  INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  ended_at   TEXT,
  PRIMARY KEY (run_id, node_id, attempt)
);
CREATE TABLE IF NOT EXISTS gates (
  id          TEXT PRIMARY KEY,
  run_id      TEXT NOT NULL,
  kind        TEXT NOT NULL,
  status      TEXT NOT NULL,
  node_id     TEXT,
  summary     TEXT NOT NULL,
  evidence    TEXT,
  opened_at   TEXT NOT NULL,
  -- What the human said when resolving, and when. Notes feed the next attempt's
  -- context pack; without them an approved retry repeats the failure blind.
  notes       TEXT,
  resolved_at TEXT
);
`;

interface NodeRow { id: string; kind: string; name: string; attrs: string | null }
interface EdgeRow {
  from: string; to: string; kind: string;
  confidence: number | null; provenance: string | null; ts: string | null;
}
interface RunRow {
  id: string; status: string; started_at: string;
  ended_at: string | null; cursor: string | null; budget_used: number;
  working_branch: string | null; base_branch: string | null; stashed: number;
}
interface ExecRow {
  run_id: string; id: string; kind: string;
  design_node_id: string | null; status: string; commit: string | null;
  evidence: string | null; attempts: number | null;
}
interface GateRow {
  id: string; run_id: string; kind: string; status: string;
  node_id: string | null; summary: string; evidence: string | null; opened_at: string;
  notes: string | null; resolved_at: string | null;
}

function toGate(r: GateRow): Gate {
  return {
    id: r.id,
    runId: r.run_id,
    kind: r.kind as Gate["kind"],
    status: r.status as GateStatus,
    nodeId: r.node_id ?? undefined,
    summary: r.summary,
    evidenceRefs: r.evidence ? (JSON.parse(r.evidence) as string[]) : [],
    openedAt: r.opened_at,
    notes: r.notes ?? undefined,
    resolvedAt: r.resolved_at ?? undefined,
  };
}

function toNode(r: NodeRow): KgNode {
  return {
    id: r.id,
    kind: r.kind as KgNode["kind"],
    name: r.name,
    attrs: r.attrs ? (JSON.parse(r.attrs) as Record<string, unknown>) : undefined,
  };
}
function toEdge(r: EdgeRow): Edge {
  return {
    from: r.from,
    to: r.to,
    kind: r.kind as Edge["kind"],
    confidence: r.confidence ?? undefined,
    provenance: (r.provenance as Edge["provenance"]) ?? undefined,
    ts: r.ts ?? undefined,
  };
}
function toRun(r: RunRow): RunRecord {
  return {
    runId: r.id,
    status: r.status as RunRecord["status"],
    startedAt: r.started_at,
    endedAt: r.ended_at ?? undefined,
    cursor: r.cursor ?? undefined,
    budgetUsed: r.budget_used,
    workingBranch: r.working_branch ?? undefined,
    baseBranch: r.base_branch ?? undefined,
    stashed: r.stashed === 1,
  };
}
function toExec(r: ExecRow): ExecNode {
  return {
    id: r.id,
    kind: r.kind as ExecNode["kind"],
    designNodeId: r.design_node_id ?? undefined,
    status: r.status as ExecNode["status"],
    commit: r.commit ?? undefined,
    evidence: r.evidence ? (JSON.parse(r.evidence) as string[]) : undefined,
    attempts: r.attempts ?? undefined,
  };
}

/** A piece of evidence on its way into the store. */
export interface EvidenceInput {
  nodeId?: string;
  criterionId?: string;
  kind: "build" | "test" | "structural" | "dom" | "visual" | "pack" | "deploy" | "agent";
  ok: boolean;
  /** Defaults to pass/fail from `ok`; packs use the fuller set. */
  status?: "pass" | "fail" | "not-applicable" | "unavailable" | "human";
  detail: string;
  artifactPath?: string;
}

export interface EvidenceRow {
  id: string;
  run_id: string;
  node_id: string | null;
  criterion_id: string | null;
  kind: string;
  ok: number;
  status: string;
  detail: string;
  artifact_path: string | null;
  ts: string;
}

export interface AttemptRow {
  run_id: string;
  node_id: string;
  attempt: number;
  executor: string | null;
  exec_ok: number;
  verify_ok: number;
  started_at: string;
  ended_at: string | null;
}

export interface MappingFilter {
  provenance?: MappingProvenance;
  minConfidence?: number;
  /** Only mapping edges touching this node. */
  node?: NodeId;
}
export interface NodeQuery {
  kind?: KgNodeKind;
  nameContains?: string;
}

export class GraphStore {
  #db: Database.Database;

  constructor(dbPath: string) {
    if (dbPath !== ":memory:") mkdirSync(dirname(dbPath), { recursive: true });
    this.#db = new Database(dbPath);
    this.#db.pragma("journal_mode = WAL");
    this.#db.exec(SCHEMA);
    this.#migrate();
  }

  // ── Knowledge graph ───────────────────────────────────────
  loadGraph(graph: DesignGraph): void {
    const tx = this.#db.transaction((g: DesignGraph) => {
      for (const n of g.nodes) this.upsertNode(n);
      for (const e of g.edges) this.upsertEdge(e);
    });
    tx(graph);
  }

  upsertNode(n: KgNode): void {
    this.#db
      .prepare(`INSERT OR REPLACE INTO kg_nodes (id, kind, name, attrs) VALUES (?, ?, ?, ?)`)
      .run(n.id, n.kind, n.name, n.attrs ? JSON.stringify(n.attrs) : null);
  }

  upsertEdge(e: Edge): void {
    this.#db
      .prepare(
        `INSERT OR REPLACE INTO edges ("from", "to", kind, confidence, provenance, ts) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(e.from, e.to, e.kind, e.confidence ?? null, e.provenance ?? null, e.ts ?? null);
  }

  getNode(id: NodeId): KgNode | undefined {
    const row = this.#db.prepare(`SELECT id, kind, name, attrs FROM kg_nodes WHERE id = ?`).get(id) as
      | NodeRow
      | undefined;
    return row ? toNode(row) : undefined;
  }

  neighbors(id: NodeId): Edge[] {
    const rows = this.#db
      .prepare(`SELECT "from", "to", kind, confidence, provenance, ts FROM edges WHERE "from" = ? OR "to" = ?`)
      .all(id, id) as EdgeRow[];
    return rows.map(toEdge);
  }

  allNodes(): KgNode[] {
    return (this.#db.prepare(`SELECT id, kind, name, attrs FROM kg_nodes`).all() as NodeRow[]).map(toNode);
  }

  allEdges(): Edge[] {
    return (
      this.#db.prepare(`SELECT "from", "to", kind, confidence, provenance, ts FROM edges`).all() as EdgeRow[]
    ).map(toEdge);
  }

  query(q: NodeQuery = {}): KgNode[] {
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (q.kind) {
      clauses.push(`kind = ?`);
      params.push(q.kind);
    }
    if (q.nameContains) {
      clauses.push(`name LIKE ?`);
      params.push(`%${q.nameContains}%`);
    }
    const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
    return (
      this.#db.prepare(`SELECT id, kind, name, attrs FROM kg_nodes${where}`).all(...params) as NodeRow[]
    ).map(toNode);
  }

  mappings(filter: MappingFilter = {}): Edge[] {
    const clauses = [`kind IN ('realizes', 'realized_by')`];
    const params: unknown[] = [];
    if (filter.provenance) {
      clauses.push(`provenance = ?`);
      params.push(filter.provenance);
    }
    if (filter.minConfidence !== undefined) {
      clauses.push(`confidence >= ?`);
      params.push(filter.minConfidence);
    }
    if (filter.node) {
      clauses.push(`("from" = ? OR "to" = ?)`);
      params.push(filter.node, filter.node);
    }
    return (
      this.#db
        .prepare(
          `SELECT "from", "to", kind, confidence, provenance, ts FROM edges WHERE ${clauses.join(" AND ")}`,
        )
        .all(...params) as EdgeRow[]
    ).map(toEdge);
  }

  gaps(): Gaps {
    return computeGaps({ nodes: this.allNodes(), edges: this.allEdges() });
  }

  // ── Run state + execution graph ───────────────────────────
  /**
   * CREATE TABLE IF NOT EXISTS never adds columns to a database that already exists,
   * so new run columns are applied here. Additive only — no drops, no rewrites.
   */
  #migrate(): void {
    const cols = new Set(
      (this.#db.prepare(`PRAGMA table_info(runs)`).all() as Array<{ name: string }>).map((c) => c.name),
    );
    const added: Array<[string, string]> = [
      ["working_branch", "TEXT"],
      ["base_branch", "TEXT"],
      ["stashed", "INTEGER NOT NULL DEFAULT 0"],
    ];
    for (const [name, type] of added) {
      if (!cols.has(name)) this.#db.exec(`ALTER TABLE runs ADD COLUMN ${name} ${type}`);
    }

    const gateCols = new Set(
      (this.#db.prepare(`PRAGMA table_info(gates)`).all() as Array<{ name: string }>).map((c) => c.name),
    );
    for (const [name, type] of [["notes", "TEXT"], ["resolved_at", "TEXT"]] as Array<[string, string]>) {
      if (!gateCols.has(name)) this.#db.exec(`ALTER TABLE gates ADD COLUMN ${name} ${type}`);
    }

    const evidenceCols = new Set(
      (this.#db.prepare(`PRAGMA table_info(evidence)`).all() as Array<{ name: string }>).map((c) => c.name),
    );
    if (evidenceCols.size && !evidenceCols.has("status")) {
      this.#db.exec(`ALTER TABLE evidence ADD COLUMN status TEXT NOT NULL DEFAULT 'pass'`);
    }

    const execCols = new Set(
      (this.#db.prepare(`PRAGMA table_info(exec_nodes)`).all() as Array<{ name: string }>).map((c) => c.name),
    );
    for (const [name, type] of [["evidence", "TEXT"], ["attempts", "INTEGER"]] as Array<[string, string]>) {
      if (!execCols.has(name)) this.#db.exec(`ALTER TABLE exec_nodes ADD COLUMN ${name} ${type}`);
    }
  }

  createRun(record: RunRecord): void {
    this.#db
      .prepare(
        `INSERT INTO runs (id, status, started_at, ended_at, cursor, budget_used, working_branch, base_branch, stashed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.runId,
        record.status,
        record.startedAt,
        record.endedAt ?? null,
        record.cursor ?? null,
        record.budgetUsed,
        record.workingBranch ?? null,
        record.baseBranch ?? null,
        record.stashed ? 1 : 0,
      );
  }

  getRun(runId: string): RunRecord | undefined {
    const row = this.#db.prepare(`SELECT * FROM runs WHERE id = ?`).get(runId) as RunRow | undefined;
    return row ? toRun(row) : undefined;
  }

  latestRun(): RunRecord | undefined {
    const row = this.#db.prepare(`SELECT * FROM runs ORDER BY started_at DESC LIMIT 1`).get() as
      | RunRow
      | undefined;
    return row ? toRun(row) : undefined;
  }

  /** Read-modify-write patch of a run record. */
  updateRun(runId: string, patch: Partial<Omit<RunRecord, "runId" | "startedAt">>): void {
    const cur = this.getRun(runId);
    if (!cur) throw new Error(`run not found: ${runId}`);
    const next: RunRecord = { ...cur, ...patch };
    this.#db
      .prepare(
        `UPDATE runs SET status = ?, ended_at = ?, cursor = ?, budget_used = ?,
         working_branch = ?, base_branch = ?, stashed = ? WHERE id = ?`,
      )
      .run(
        next.status,
        next.endedAt ?? null,
        next.cursor ?? null,
        next.budgetUsed,
        next.workingBranch ?? null,
        next.baseBranch ?? null,
        next.stashed ? 1 : 0,
        runId,
      );
  }

  upsertExecNode(runId: string, node: ExecNode): void {
    this.#db
      .prepare(
        `INSERT OR REPLACE INTO exec_nodes (run_id, id, kind, design_node_id, status, "commit", evidence, attempts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        runId,
        node.id,
        node.kind,
        node.designNodeId ?? null,
        node.status,
        node.commit ?? null,
        node.evidence ? JSON.stringify(node.evidence) : null,
        node.attempts ?? null,
      );
  }

  getExecGraph(runId: string): ExecNode[] {
    return (
      this.#db
        .prepare(
          `SELECT run_id, id, kind, design_node_id, status, "commit", evidence, attempts FROM exec_nodes WHERE run_id = ?`,
        )
        .all(runId) as ExecRow[]
    ).map(toExec);
  }

  getExecNode(runId: string, id: NodeId): ExecNode | undefined {
    const row = this.#db
      .prepare(
        `SELECT run_id, id, kind, design_node_id, status, "commit", evidence, attempts FROM exec_nodes WHERE run_id = ? AND id = ?`,
      )
      .get(runId, id) as ExecRow | undefined;
    return row ? toExec(row) : undefined;
  }

  // ── Gates ─────────────────────────────────────────────────
  /** Plain INSERT: gate ids are unique per occurrence, so history is never overwritten. */
  openGate(gate: Gate): void {
    this.#db
      .prepare(
        `INSERT INTO gates (id, run_id, kind, status, node_id, summary, evidence, opened_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        gate.id,
        gate.runId,
        gate.kind,
        gate.status,
        gate.nodeId ?? null,
        gate.summary,
        JSON.stringify(gate.evidenceRefs),
        gate.openedAt,
      );
  }

  /** How many gates of this kind this run has already opened — the id sequence. */
  countGates(runId: string, kind: string): number {
    const row = this.#db
      .prepare(`SELECT COUNT(*) AS n FROM gates WHERE run_id = ? AND kind = ?`)
      .get(runId, kind) as { n: number };
    return row.n;
  }

  // ── Evidence + attempts ───────────────────────────────────
  recordEvidence(runId: string, records: EvidenceInput[]): string[] {
    const ids: string[] = [];
    const insert = this.#db.prepare(
      `INSERT INTO evidence (id, run_id, node_id, criterion_id, kind, ok, status, detail, artifact_path, ts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const tx = this.#db.transaction((rows: EvidenceInput[]) => {
      for (const r of rows) {
        if (!r.kind || typeof r.ok !== "boolean" || !r.detail) {
          throw new Error(`malformed evidence record: ${JSON.stringify(r)} — needs kind, ok and detail`);
        }
        const id = `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        insert.run(
          id,
          runId,
          r.nodeId ?? null,
          r.criterionId ?? null,
          r.kind,
          r.ok ? 1 : 0,
          r.status ?? (r.ok ? "pass" : "fail"),
          r.detail,
          r.artifactPath ?? null,
          new Date().toISOString(),
        );
        ids.push(id);
      }
    });
    tx(records);
    return ids;
  }

  evidenceFor(filter: { runId?: string; nodeId?: string; criterionId?: string } = {}): EvidenceRow[] {
    const clauses: string[] = [];
    const params: unknown[] = [];
    for (const [col, value] of [
      ["run_id", filter.runId],
      ["node_id", filter.nodeId],
      ["criterion_id", filter.criterionId],
    ] as Array<[string, string | undefined]>) {
      if (value !== undefined) {
        clauses.push(`${col} = ?`);
        params.push(value);
      }
    }
    const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
    return this.#db
      .prepare(`SELECT * FROM evidence${where} ORDER BY ts`)
      .all(...params) as EvidenceRow[];
  }

  recordAttempt(a: AttemptRow): void {
    this.#db
      .prepare(
        `INSERT OR REPLACE INTO attempts (run_id, node_id, attempt, executor, exec_ok, verify_ok, started_at, ended_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(a.run_id, a.node_id, a.attempt, a.executor ?? null, a.exec_ok, a.verify_ok, a.started_at, a.ended_at ?? null);
  }

  attemptsFor(runId: string): AttemptRow[] {
    return this.#db
      .prepare(`SELECT * FROM attempts WHERE run_id = ? ORDER BY node_id, attempt`)
      .all(runId) as AttemptRow[];
  }

  allRuns(): RunRecord[] {
    return (this.#db.prepare(`SELECT * FROM runs ORDER BY started_at`).all() as RunRow[]).map(toRun);
  }

  gatesForRun(runId: string): Gate[] {
    return (
      this.#db.prepare(`SELECT * FROM gates WHERE run_id = ? ORDER BY opened_at`).all(runId) as GateRow[]
    ).map(toGate);
  }

  /** Notes from the most recently resolved gate on this run, for the next attempt's context. */
  latestGateNotes(runId: string): string | undefined {
    const row = this.#db
      .prepare(
        `SELECT notes FROM gates WHERE run_id = ? AND notes IS NOT NULL AND notes != ''
         ORDER BY resolved_at DESC LIMIT 1`,
      )
      .get(runId) as { notes: string } | undefined;
    return row?.notes;
  }

  getGate(id: string): Gate | undefined {
    const row = this.#db.prepare(`SELECT * FROM gates WHERE id = ?`).get(id) as GateRow | undefined;
    return row ? toGate(row) : undefined;
  }

  listGates(status?: GateStatus): Gate[] {
    const rows = (status
      ? this.#db.prepare(`SELECT * FROM gates WHERE status = ? ORDER BY opened_at`).all(status)
      : this.#db.prepare(`SELECT * FROM gates ORDER BY opened_at`).all()) as GateRow[];
    return rows.map(toGate);
  }

  setGateStatus(id: string, status: GateStatus, notes?: string): void {
    this.#db
      .prepare(`UPDATE gates SET status = ?, notes = ?, resolved_at = ? WHERE id = ?`)
      .run(status, notes ?? null, new Date().toISOString(), id);
  }

  close(): void {
    this.#db.close();
  }
}
