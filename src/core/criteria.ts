// The criteria pass (decision #25): an independent step that authors what "done" means,
// before any implementation exists. It reads intent (the IR) and the chosen design guide —
// never the implementer's output — so the thing being judged cannot author its own bar.
//
// Requirements are per project with stable ids derived from IR element ids, so a second run
// updates coverage instead of duplicating it.
//
// V2.1 mints criteria from three deterministic sources. An LLM-assisted pass is the documented
// upgrade, not the starting point:
//   1. the floor every style inherits (design-guide/_base.md)
//   2. the chosen style guide's own checks
//   3. structure implied by the IR (pages exist, named components are present)
//
// Most criteria have no runner until V2.2 brings browser, Lighthouse and pack runners. Those
// are minted anyway and marked `pending`, so evidence coverage reports the truth rather than a
// flattering subset.

import { loadBaseChecks } from "./design/style.js";
import type { StyleCheck, StyleGuide } from "./design/style.js";
import type { DesignIR } from "./ir/schema.js";
import type { Edge, KgNode } from "./graph/types.js";

/** Which runner can produce evidence for a criterion today. */
export type CriterionRunner = "build" | "structural" | "pending" | "judged";

export interface CriteriaResult {
  nodes: KgNode[];
  edges: Edge[];
}

export const REQ_BASE = "req:quality-floor";
export const REQ_STYLE = "req:visual-style";

function requirement(id: string, name: string, attrs: Record<string, unknown>): KgNode {
  return { id, kind: "requirement", name, attrs };
}

function criterion(
  id: string,
  rule: string,
  runner: CriterionRunner,
  source: string,
  kind: StyleCheck["kind"] = "deterministic",
): KgNode {
  return {
    id: `crit:${id}`,
    kind: "criterion",
    name: rule.length > 90 ? `${rule.slice(0, 87)}…` : rule,
    attrs: { rule, runner, source, judged: kind === "judged" },
  };
}

/**
 * Criteria whose evidence the deterministic verifier already produces today. Everything else
 * needs a browser, Lighthouse or a pack runner, and is minted as `pending`.
 */
function runnerFor(check: StyleCheck): CriterionRunner {
  if (check.kind === "judged") return "judged";
  // The scaffold's own check script enforces these, so the build step proves them.
  const provenByBuild = [
    "base.a11y.semantics",
    "base.responsive.type",
    "base.perf.images",
  ];
  return provenByBuild.includes(check.id) ? "build" : "pending";
}

/**
 * Mint requirements and criteria for a project. Pure — callers persist the result.
 */
export function mintCriteria(ir: DesignIR, style?: StyleGuide): CriteriaResult {
  const nodes: KgNode[] = [];
  const edges: Edge[] = [];
  const ts = new Date().toISOString();
  const link = (from: string, to: string, kind: Edge["kind"]): void => {
    edges.push({ from, to, kind, ts });
  };

  // ── 1. One requirement per design element, covering its design node ──
  const elements: Array<{ id: string; label: string; type: string }> = [
    ...ir.pages.map((p) => ({ id: p.id, label: `Page "${p.name}" exists at ${p.route}`, type: "page" })),
    ...ir.components.map((c) => ({ id: c.id, label: `Component "${c.name}" is built`, type: "component" })),
    ...ir.assets.map((a) => ({ id: a.id, label: `Asset "${a.id}" is present`, type: "asset" })),
  ];

  for (const el of elements) {
    const reqId = `req:design:${el.id}`;
    nodes.push(requirement(reqId, el.label, { source: "ir", designNodeId: el.id, elementType: el.type }));
    link(reqId, el.id, "covers");

    // Structural criteria the build can actually prove today.
    const structural =
      el.type === "page"
        ? criterion(`${el.id}.page-exists`, `a page for "${el.id}" exists and builds`, "build", "ir")
        : el.type === "asset"
          ? criterion(`${el.id}.asset-present`, `asset "${el.id}" is referenced by the built site`, "pending", "ir")
          : criterion(`${el.id}.section-present`, `a section for "${el.id}" is present in the built page`, "structural", "ir");
    nodes.push(structural);
    link(structural.id, reqId, "verifies");
  }

  // ── 2. Project-level requirements from IR constraints ──
  const constraintReqs: Array<[string, string, CriterionRunner]> = [
    ["mobile", `the site works at mobile width`, "pending"],
    ["accessibility", `the site meets WCAG ${ir.constraints.accessibility}`, "pending"],
    ["seo", `the site is indexable with page metadata`, "pending"],
  ];
  for (const [key, label, runner] of constraintReqs) {
    const enabled = key === "accessibility" ? true : Boolean((ir.constraints as Record<string, unknown>)[key]);
    if (!enabled) continue;
    const reqId = `req:constraint:${key}`;
    nodes.push(requirement(reqId, label, { source: "ir-constraint", constraint: key }));
    const crit = criterion(`constraint.${key}`, label, runner, "ir-constraint");
    nodes.push(crit);
    link(crit.id, reqId, "verifies");
  }

  // ── 3. The quality floor every style inherits ──
  nodes.push(
    requirement(REQ_BASE, "The build meets the baseline quality floor", { source: "design-guide/_base.md" }),
  );
  for (const check of loadBaseChecks()) {
    const crit = criterion(check.id, check.rule, runnerFor(check), "_base.md", check.kind);
    nodes.push(crit);
    link(crit.id, REQ_BASE, "verifies");
  }

  // ── 4. The chosen style's own checks ──
  if (style) {
    nodes.push(
      requirement(REQ_STYLE, `The build follows the ${style.title} style`, {
        source: `design-guide/${style.slug}.md`,
        style: style.slug,
      }),
    );
    for (const check of style.checks) {
      const crit = criterion(
        check.id,
        check.rule,
        check.kind === "judged" ? "judged" : "pending",
        `${style.slug}.md`,
        check.kind,
      );
      nodes.push(crit);
      link(crit.id, REQ_STYLE, "verifies");
    }
  }

  // Ids are stable and deterministic, so a re-run mints the same set. Dedupe defensively in
  // case a style check collides with a base check id.
  const seen = new Set<string>();
  return {
    nodes: nodes.filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true))),
    edges,
  };
}
