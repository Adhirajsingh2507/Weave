// Test and demo double for an agent that follows the V2.3 contract. Not part of the public API.
//
// A component writes one fragment; a page builds its shell and drops the placeholder marker;
// an unrestricted node (a project the template did not create) fills its slot in index.html.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ExecInput, ExecResult } from "./runtime.js";

export function realise(input: ExecInput, inner?: string): ExecResult {
  const id = input.contextPack.taskId.replace("impl:", "");
  const write = input.contextPack.permissions.write;
  const dir = input.worktreeDir;
  const section = `<section id="${id}" data-design-node="${id}">${inner ?? `<h2>${id}</h2><p>Built.</p>`}</section>`;

  if (write.includes(`sections/${id}.html`)) {
    mkdirSync(join(dir, "sections"), { recursive: true });
    writeFileSync(join(dir, "sections", `${id}.html`), `${section}\n`, "utf8");
    return { ok: true, summary: `wrote sections/${id}.html`, changedFiles: [`sections/${id}.html`], evidenceRefs: [`edit:${id}`] };
  }

  const pageFile = write.find((f) => f.endsWith(".html"));
  if (pageFile) {
    const html = readFileSync(join(dir, pageFile), "utf8");
    writeFileSync(join(dir, pageFile), html.replace(/(<body\b[^>]*?)\s+data-placeholder/, "$1"), "utf8");
    return { ok: true, summary: `built the ${id} page shell`, changedFiles: [pageFile], evidenceRefs: [`edit:${id}`] };
  }

  const page = join(dir, "index.html");
  if (!existsSync(page)) {
    writeFileSync(join(dir, `${id}.html`), `${section}\n`, "utf8");
    return { ok: true, summary: `wrote ${id}.html`, changedFiles: [`${id}.html`], evidenceRefs: [`edit:${id}`] };
  }
  const html = readFileSync(page, "utf8");
  const slot = new RegExp(`<section id="${id}"[^>]*>.*?</section>`, "s");
  // No slot (a page, in a project the template did not lay out): add the element instead.
  const next = slot.test(html) ? html.replace(slot, () => section) : html.replace("</body>", `${section}\n</body>`);
  writeFileSync(page, next, "utf8");
  return { ok: true, summary: `filled ${id}`, changedFiles: ["index.html"], evidenceRefs: [`edit:${id}`] };
}
