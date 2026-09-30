// Phase 6 — execution-graph generation (decision #26): fixed skeleton + dynamic fan-out.
// One impl node per unrealized design node; QA nodes follow. No free synthesis.
//
// V2.3 makes the fan-out a DAG with a shared contract: components write their own fragment,
// pages own their page file, and only the scaffold and integration touch shared files. Most
// conflicts then disappear by construction instead of being resolved.

import type { ExecNode } from "./graph/types.js";
import type { DesignIR } from "./ir/schema.js";

/** A page and the component slots it carries. */
export interface PageLayout {
  id: string;
  name: string;
  route: string;
  /** The page's file. The home page is always index.html, because the build requires one. */
  file: string;
  /** Component ids slotted into this page, in order. */
  sections: string[];
}

/**
 * Which components live on which page. A component listed in a page's sections belongs to that
 * page; a component no page lists belongs to the home page (route "/", else the first page).
 */
export function pageLayout(ir: DesignIR): PageLayout[] {
  if (!ir.pages.length) return [];
  const home = ir.pages.find((p) => p.route === "/") ?? ir.pages[0]!;
  const components = new Set(ir.components.map((c) => c.id));
  const listed = new Set(ir.pages.flatMap((p) => p.sections));
  const unlisted = ir.components.map((c) => c.id).filter((id) => !listed.has(id));
  return ir.pages.map((p) => ({
    id: p.id,
    name: p.name,
    route: p.route,
    file: p === home ? "index.html" : `${p.id}.html`,
    sections: [...p.sections.filter((s) => components.has(s)), ...(p === home ? unlisted : [])],
  }));
}

/** Where a component writes its work. The only files it may change. */
export function componentOwns(id: string): string[] {
  return [`sections/${id}.html`, `sections/${id}/`, `styles/sections/${id}.css`];
}

/** Build the execution graph for a run from the unrealized-design work list. */
export function buildExecGraph(unrealizedDesign: string[], ir?: DesignIR): ExecNode[] {
  const nodes: ExecNode[] = [];
  // Pre-impl skeleton stages are complete by the time we plan (intake/analysis done).
  for (const kind of ["intake", "plan", "design-analysis", "architecture"] as const) {
    nodes.push({ id: kind, kind, status: "complete" });
  }
  // The project itself, created by a fixed template step before any agent runs.
  // Without it a greenfield repo has nothing to build on and every impl node fails verify.
  nodes.push({ id: "scaffold", kind: "scaffold", status: "pending" });

  // Fan-out: one implementation node per unrealized design node, ordered by the DAG
  // scaffold → components/assets → pages (a page waits for its own sections) → integration.
  const layout = ir ? pageLayout(ir) : [];
  const implIds = new Set(unrealizedDesign.map((d) => `impl:${d}`));
  for (const d of unrealizedDesign) {
    const page = layout.find((p) => p.id === d);
    const isAsset = ir?.assets.some((a) => a.id === d) ?? false;
    const node: ExecNode = { id: `impl:${d}`, kind: "impl", designNodeId: d, status: "pending" };
    if (page) {
      node.dependsOn = ["scaffold", ...page.sections.map((s) => `impl:${s}`).filter((id) => implIds.has(id))];
      node.owns = [page.file, `styles/pages/${d}.css`];
    } else {
      node.dependsOn = ["scaffold"];
      node.owns = isAsset ? ["assets/"] : componentOwns(d);
    }
    nodes.push(node);
  }
  // Post-impl QA stages. Integration waits on every impl node.
  nodes.push({ id: "integration", kind: "integration", status: "pending", dependsOn: [...implIds] });
  for (const kind of ["code-qa", "browser-qa", "visual-qa"] as const) {
    nodes.push({ id: kind, kind, status: "pending" });
  }
  // Final release (deploy), driven by the pre-release gate; skipped if no deployer.
  nodes.push({ id: "release", kind: "release", status: "pending" });
  return nodes;
}

/** The impl fan-out nodes, in order. */
export function implNodes(nodes: ExecNode[]): ExecNode[] {
  return nodes.filter((n) => n.kind === "impl");
}

/**
 * Impl nodes whose dependencies are all satisfied. A dependency not in this run's graph was
 * realised by an earlier run, so it counts as satisfied.
 */
export function readyNodes(graph: ExecNode[]): ExecNode[] {
  const byId = new Map(graph.map((n) => [n.id, n]));
  const settled = (id: string): boolean => {
    const dep = byId.get(id);
    return !dep || dep.status === "complete" || dep.status === "skipped";
  };
  // Escalated and running nodes are re-runnable: a gate approval retries the first, a crashed
  // process leaves the second. Blocked nodes wait on a risky-op gate, not the scheduler.
  const runnable = (n: ExecNode): boolean => !["complete", "skipped", "blocked", "cancelled"].includes(n.status);
  return graph.filter((n) => n.kind === "impl" && runnable(n) && (n.dependsOn ?? []).every(settled));
}

/** Does a changed path fall inside a node's ownership set? */
export function isOwned(path: string, owns: string[]): boolean {
  return owns.some((o) => (o.endsWith("/") ? path.startsWith(o) : path === o));
}
