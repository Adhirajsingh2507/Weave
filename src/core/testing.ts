// Test and demo double for an agent that follows the V2.3 contract. Not part of the public API.
//
// A component writes one fragment; a page builds its shell and drops the placeholder marker;
// an unrestricted node (a project the template did not create) fills its slot in index.html.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { crc32, deflateSync } from "node:zlib";
import type { ExecInput, ExecResult } from "./runtime.js";

export function realise(input: ExecInput, inner?: string): ExecResult {
  const id = input.contextPack.taskId.replace("impl:", "");
  const write = input.contextPack.permissions.write;
  const dir = input.worktreeDir;
  // With no markup given, place whatever assets the brief says this section places.
  const told = input.contextPack.constraints.find((c) => c.startsWith("Place these assets")) ?? "";
  const placed = [...new Set(told.match(/assets\/[\w.-]+/g) ?? [])]
    .map((p) => (/\.(glb|gltf)$/.test(p) ? `<model-viewer src="${p}" alt="${id} model" camera-controls style="width:100%;height:480px"></model-viewer>` : `<img src="${p}" alt="${id} image">`))
    .join("");
  const section = `<section id="${id}" data-design-node="${id}">${inner ?? `<h2>${id}</h2><p>Built.</p>${placed}`}</section>`;

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

/** A valid glTF 2.0 binary holding `triangles` non-indexed triangles — a real file to measure. */
export function tinyGlb(triangles: number): Buffer {
  const positions = new Float32Array(triangles * 9);
  for (let t = 0; t < triangles; t++) positions.set([t, 0, 0, t + 1, 0, 0, t, 1, 0], t * 9);
  const bin = Buffer.from(positions.buffer);
  const json = {
    asset: { version: "2.0", generator: "weave testing" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, mode: 4 }] }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: bin.length }],
    accessors: [{ bufferView: 0, componentType: 5126, count: triangles * 3, type: "VEC3", min: [0, 0, 0], max: [triangles, 1, 0] }],
  };
  const pad = (b: Buffer, fill: number): Buffer => Buffer.concat([b, Buffer.alloc((4 - (b.length % 4)) % 4, fill)]);
  const jsonChunk = pad(Buffer.from(JSON.stringify(json)), 0x20);
  const binChunk = pad(bin, 0);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);
  const chunk = (type: number, data: Buffer): Buffer => {
    const h = Buffer.alloc(8);
    h.writeUInt32LE(data.length, 0);
    h.writeUInt32LE(type, 4);
    return Buffer.concat([h, data]);
  };
  return Buffer.concat([header, chunk(0x4e4f534a, jsonChunk), chunk(0x004e4942, binChunk)]);
}

/** A valid solid-colour PNG of the given size. */
export function tinyPng(width: number, height: number, rgb: [number, number, number] = [30, 60, 90]): Buffer {
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3).map((_, i) => rgb[i % 3]!)]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  const chunk = (type: string, data: Buffer): Buffer => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
