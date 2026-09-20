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
  id          TEXT PRIMARY KEY,
  status      TEXT NOT NULL,
  started_at  TEXT NOT NULL,
  ended_at    TEXT,
  cursor      TEXT,
  budget_used INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS exec_nodes (
  run_id         TEXT NOT NULL,
  id             TEXT NOT NULL,
  kind           TEXT NOT NULL,
  design_node_id TEXT,
  status         TEXT NOT NULL,
  "commit"       TEXT,
  PRIMARY KEY (run_id, id)
);
CREATE TABLE IF NOT EXISTS gates (
  id        TEXT PRIMARY KEY,
  run_id    TEXT NOT NULL,
  kind      TEXT NOT NULL,
  status    TEXT NOT NULL,
  node_id   TEXT,
  summary   TEXT NOT NULL,
  evidence  TEXT,
  opened_at TEXT NOT NULL
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
}
interface ExecRow {
  run_id: string; id: string; kind: string;
  design_node_id: string | null; status: string; commit: string | null;
}
interface GateRow {
  id: string; run_id: string; kind: string; status: string;
  node_id: string | null; summary: string; evidence: string | null; opened_at: string;
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
  };
}
function toExec(r: ExecRow): ExecNode {
  return {
    id: r.id,
    kind: r.kind as ExecNode["kind"],
    designNodeId: r.design_node_id ?? undefined,
    status: r.status as ExecNode["status"],
    commit: r.commit ?? undefined,
  };
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
  createRun(record: RunRecord): void {
    this.#db
      .prepare(
        `INSERT INTO runs (id, status, started_at, ended_at, cursor, budget_used) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.runId,
        record.status,
        record.startedAt,
        record.endedAt ?? null,
        record.cursor ?? null,
        record.budgetUsed,
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
      .prepare(`UPDATE runs SET status = ?, ended_at = ?, cursor = ?, budget_used = ? WHERE id = ?`)
      .run(next.status, next.endedAt ?? null, next.cursor ?? null, next.budgetUsed, runId);
  }

  upsertExecNode(runId: string, node: ExecNode): void {
    this.#db
      .prepare(
        `INSERT OR REPLACE INTO exec_nodes (run_id, id, kind, design_node_id, status, "commit") VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(runId, node.id, node.kind, node.designNodeId ?? null, node.status, node.commit ?? null);
  }

  getExecGraph(runId: string): ExecNode[] {
    return (
      this.#db
        .prepare(`SELECT run_id, id, kind, design_node_id, status, "commit" FROM exec_nodes WHERE run_id = ?`)
        .all(runId) as ExecRow[]
    ).map(toExec);
  }

  getExecNode(runId: string, id: NodeId): ExecNode | undefined {
    const row = this.#db
      .prepare(`SELECT run_id, id, kind, design_node_id, status, "commit" FROM exec_nodes WHERE run_id = ? AND id = ?`)
      .get(runId, id) as ExecRow | undefined;
    return row ? toExec(row) : undefined;
  }

  // ── Gates ─────────────────────────────────────────────────
  openGate(gate: Gate): void {
    this.#db
      .prepare(
        `INSERT OR REPLACE INTO gates (id, run_id, kind, status, node_id, summary, evidence, opened_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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

  setGateStatus(id: string, status: GateStatus): void {
    this.#db.prepare(`UPDATE gates SET status = ? WHERE id = ?`).run(status, id);
  }

  close(): void {
    this.#db.close();
  }
}
