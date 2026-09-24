// Phase 1 — project the canonical Design IR into a design-subgraph, and compute gaps.
// Pure + deterministic (no store/LLM/agent). Stable node IDs = IR element ids (decision #22),
// so code<->design mapping edges rebind across IR versions.

import type { DesignIR } from "../ir/schema.js";
import type { Edge, KgNode } from "./types.js";
import type { NodeId } from "../types.js";

export interface DesignGraph {
  nodes: KgNode[];
  edges: Edge[];
}

/** IR -> design-subgraph nodes + structural edges (component belongs_to page). */
export function projectIR(ir: DesignIR): DesignGraph {
  const nodes: KgNode[] = [];
  const edges: Edge[] = [];
  const ts = new Date().toISOString();
  const componentIds = new Set(ir.components.map((c) => c.id));

  for (const p of ir.pages) {
    nodes.push({ id: p.id, kind: "design", name: p.name, attrs: { type: "page", route: p.route } });
  }
  for (const c of ir.components) {
    nodes.push({
      id: c.id,
      kind: "design",
      name: c.name,
      attrs: { type: "component", componentKind: c.kind },
    });
  }
  for (const a of ir.assets) {
    nodes.push({ id: a.id, kind: "asset", name: a.id, attrs: { type: a.type, src: a.src } });
  }

  // A page's section refs that name a known component become belongs_to edges.
  for (const p of ir.pages) {
    for (const section of p.sections) {
      if (componentIds.has(section)) {
        edges.push({ from: section, to: p.id, kind: "belongs_to", ts });
      }
    }
  }

  return { nodes, edges };
}

export interface Gaps {
  /** Design/asset nodes with no code realizing them — the work list. */
  unrealizedDesign: NodeId[];
  /** Code nodes with no design mapping — flagged for review. */
  orphanCode: NodeId[];
}

/** Gaps that define the work (decision #12). Mapping edges are realizes/realized_by. */
export function computeGaps(graph: DesignGraph): Gaps {
  const realizedDesign = new Set<NodeId>();
  const realizedCode = new Set<NodeId>();
  for (const e of graph.edges) {
    if (e.kind === "realized_by") {
      realizedDesign.add(e.from);
      realizedCode.add(e.to);
    } else if (e.kind === "realizes") {
      realizedCode.add(e.from);
      realizedDesign.add(e.to);
    }
  }

  const unrealizedDesign: NodeId[] = [];
  const orphanCode: NodeId[] = [];
  // Only things an agent can build count as unrealized work. Requirements, criteria and
  // package nodes live in the same graph but are not build targets — treating every
  // non-code node as work made the fan-out plan a node per criterion.
  const buildable = new Set<KgNode["kind"]>(["design", "asset"]);
  for (const n of graph.nodes) {
    if (n.kind === "code") {
      if (!realizedCode.has(n.id)) orphanCode.push(n.id);
    } else if (buildable.has(n.kind) && !realizedDesign.has(n.id)) {
      unrealizedDesign.push(n.id);
    }
  }
  return { unrealizedDesign, orphanCode };
}
