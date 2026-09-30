#!/usr/bin/env node
// D4 — the demo's robot: Unitree's own Go2 (decision #87), assembled from its URDF and seven DAE
// meshes into one glTF, posed standing, simplified and quantised to the 3D budget
// (2 MB / 100k triangles). Reproducible: the upstream commit and every file's SHA-256 are pinned.
//
// Source: github.com/unitreerobotics/unitree_ros, robots/go2_description — BSD-3-Clause,
// © HangZhou YuShu TECHNOLOGY CO.,LTD. ("Unitree Robotics"). The notice ships beside the model.
//
// How: the URDF is walked in a real browser (Playwright's Chromium) with three.js's ColladaLoader
// and GLTFExporter — the loaders need a DOM. gltf-transform then welds, simplifies and quantises.
//
// Usage: node scripts/go2-model.mjs [outDir]   (default examples/assets)

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.argv[2] ?? join(ROOT, "examples", "assets");
const COMMIT = "5994d4faef0a9cadd3287f8de0199a67eeb2a259";
const BASE = `https://raw.githubusercontent.com/unitreerobotics/unitree_ros/${COMMIT}/robots/go2_description`;
const FILES = {
  "urdf/go2_description.urdf": null,
  "dae/base.dae": null,
  "dae/hip.dae": null,
  "dae/thigh.dae": null,
  "dae/thigh_mirror.dae": null,
  "dae/calf.dae": null,
  "dae/calf_mirror.dae": null,
  "dae/foot.dae": null,
};
const PINS = JSON.parse(readFileSync(join(ROOT, "scripts", "go2-model.sha256.json"), "utf8"));
/** Unitree's standing pose, in radians; every other joint stays at zero. */
const STAND = { thigh: 0.67, calf: -1.3 };
const BUDGET = { bytes: 2 * 1024 * 1024, triangles: 100_000 };

// ── 1. Fetch, pinned ─────────────────────────────────────────
const work = mkdtempSync(join(tmpdir(), "weave-go2-"));
const cache = process.env.GO2_CACHE; // a folder already holding the files, to skip the download
for (const rel of Object.keys(FILES)) {
  const dest = join(work, rel);
  mkdirSync(dirname(dest), { recursive: true });
  if (cache && existsSync(join(cache, rel))) copyFileSync(join(cache, rel), dest);
  else {
    const res = await fetch(`${BASE}/${rel}`);
    if (!res.ok) throw new Error(`${rel}: ${res.status}`);
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  }
  const sha = createHash("sha256").update(readFileSync(dest)).digest("hex");
  if (PINS[rel] !== sha) throw new Error(`${rel}: sha256 ${sha} does not match the pin ${PINS[rel]}`);
}
console.log(`fetched ${Object.keys(FILES).length} files at unitree_ros@${COMMIT.slice(0, 7)} (sha256 verified)`);

// ── 2. Assemble in the browser ───────────────────────────────
const { serve } = await import(join(ROOT, "dist", "core", "benchmark.js"));
const { openPage } = await import(join(ROOT, "dist", "core", "browser.js"));
const three = join(ROOT, "node_modules", "three");
execFileSync("cp", ["-rL", three, join(work, "three")]); // -L: pnpm links packages into its store
writeFileSync(
  join(work, "index.html"),
  `<!doctype html><script type="importmap">{"imports":{"three":"./three/build/three.module.js","three/addons/":"./three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from "three";
import { ColladaLoader } from "three/addons/loaders/ColladaLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
const STAND = ${JSON.stringify(STAND)};
const urdf = new DOMParser().parseFromString(await (await fetch("urdf/go2_description.urdf")).text(), "text/xml");
const vec = (s) => (s ?? "0 0 0").trim().split(/\\s+/).map(Number);
// URDF rpy is roll-pitch-yaw about fixed X, Y, Z: in three.js terms, Euler order ZYX.
const place = (obj, origin) => {
  obj.position.fromArray(vec(origin?.getAttribute("xyz")));
  const [r, p, y] = vec(origin?.getAttribute("rpy"));
  obj.quaternion.setFromEuler(new THREE.Euler(r, p, y, "ZYX"));
};
const loader = new ColladaLoader();
const meshes = {};
// No material has a texture, so UVs are dead weight; normals split vertices at every hard edge.
// Without both, vertices weld and the simplifier can work; a glTF without normals renders flat-shaded,
// which suits a machined body.
const lean = (scene) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone();
    g.deleteAttribute("uv");
    g.deleteAttribute("normal");
    o.geometry = mergeVertices(g, 1e-5);
  });
  return scene;
};
const load = async (file) => (meshes[file] ??= lean(await new Promise((ok, no) => loader.load(file, (c) => ok(c.scene), undefined, no))));
const links = {};
for (const link of urdf.querySelectorAll("robot > link")) {
  const group = new THREE.Group();
  group.name = link.getAttribute("name");
  for (const visual of link.querySelectorAll(":scope > visual")) {
    const mesh = visual.querySelector("geometry > mesh");
    if (!mesh) continue;
    const file = mesh.getAttribute("filename").replace("package://go2_description/", "");
    const scene = (await load(file)).clone(true);
    // Keep the mesh in its native Z-up frame: the URDF is Z-up too, and the root is turned once.
    scene.rotation.set(0, 0, 0);
    const holder = new THREE.Group();
    place(holder, visual.querySelector(":scope > origin"));
    holder.add(scene);
    group.add(holder);
  }
  links[group.name] = group;
}
let root;
const children = new Set();
for (const joint of urdf.querySelectorAll("robot > joint")) {
  const parent = links[joint.querySelector("parent").getAttribute("link")];
  const child = links[joint.querySelector("child").getAttribute("link")];
  children.add(child);
  const frame = new THREE.Group();
  frame.name = joint.getAttribute("name");
  place(frame, joint.querySelector(":scope > origin"));
  const kind = /_(thigh|calf)_joint$/.exec(frame.name)?.[1];
  if (joint.getAttribute("type") === "revolute" && kind) {
    const axis = new THREE.Vector3(...vec(joint.querySelector("axis")?.getAttribute("xyz") ?? "1 0 0")).normalize();
    child.quaternion.setFromAxisAngle(axis, STAND[kind]);
  }
  frame.add(child);
  parent.add(frame);
}
root = Object.values(links).find((l) => !children.has(l));
const robot = new THREE.Group();
robot.name = "Unitree Go2";
robot.rotation.x = -Math.PI / 2; // ROS Z-up → glTF Y-up
robot.add(root);
const glb = await new GLTFExporter().parseAsync(robot, { binary: true });
const bytes = new Uint8Array(glb);
let s = "";
for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
window.__glb = btoa(s);
</script>`,
);
const site = await serve(work);
const { browser, page } = await openPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
let b64;
try {
  await page.goto(site.url, { waitUntil: "load", timeout: 120_000 });
  for (let i = 0; i < 600 && !b64 && !errors.length; i++) {
    b64 = await page.evaluate("window.__glb");
    if (!b64) await new Promise((r) => setTimeout(r, 500));
  }
} finally {
  await browser.close();
  await site.close();
}
if (!b64) throw new Error(`the browser did not produce a glTF: ${errors.join(" | ") || "timed out"}`);
const raw = join(work, "go2-raw.glb");
writeFileSync(raw, Buffer.from(b64, "base64"));
console.log(`assembled: ${(statSync(raw).size / 1024 / 1024).toFixed(1)} MB`);

// ── 3. Fit the budget ────────────────────────────────────────
const { measureAsset } = await import(join(ROOT, "dist", "core", "assets.js"));
const gt = join(ROOT, "node_modules", ".bin", "gltf-transform");
mkdirSync(OUT, { recursive: true });
const out = join(OUT, "go2.glb");
let ratio = 1;
for (let attempt = 0; attempt < 8; attempt++) {
  // No join/flatten: the four legs stay instances of one mesh instead of four copies.
  execFileSync(gt, ["optimize", raw, out, "--compress", "quantize", "--join", "false", "--flatten", "false", "--simplify-ratio", String(ratio), "--simplify-error", "0.002"], { stdio: "ignore" });
  const m = measureAsset(out);
  console.log(`ratio ${ratio.toFixed(3)}: ${(m.sizeBytes / 1024).toFixed(0)} KB, ${m.triangles} triangles`);
  if (m.sizeBytes <= BUDGET.bytes && m.triangles <= BUDGET.triangles) break;
  ratio *= Math.min(0.8, BUDGET.triangles / Math.max(m.triangles, 1), BUDGET.bytes / m.sizeBytes);
}
const final = measureAsset(out);
if (final.sizeBytes > BUDGET.bytes || final.triangles > BUDGET.triangles) throw new Error("could not fit the 3D budget");
writeFileSync(
  join(OUT, "go2.CREDITS.md"),
  `# go2.glb — credits and licence

Unitree Go2, assembled by \`scripts/go2-model.mjs\` from Unitree's own description package:
https://github.com/unitreerobotics/unitree_ros/tree/${COMMIT}/robots/go2_description

Posed standing (thigh ${STAND.thigh} rad, calf ${STAND.calf} rad), simplified and quantised to
${(final.sizeBytes / 1024).toFixed(0)} KB and ${final.triangles} triangles.

BSD 3-Clause License

Copyright (c) 2016-2022 HangZhou YuShu TECHNOLOGY CO.,LTD. ("Unitree Robotics")
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted
provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions
   and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of
   conditions and the following disclaimer in the documentation and/or other materials provided
   with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to
   endorse or promote products derived from this software without specific prior written
   permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
`,
);
console.log(`→ ${out}: ${(final.sizeBytes / 1024).toFixed(0)} KB, ${final.triangles} triangles (budget 2048 KB / 100000)`);
