#!/usr/bin/env node
// D2 — tools that are not npm packages, downloaded pinned: version and SHA-256 are in this file,
// so a changed upstream artifact fails the install instead of running. Installs into .tools/bin/,
// where Weave looks before PATH. Usage: pnpm tools:gitleaks

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GITLEAKS = {
  version: "8.30.1",
  sha256: {
    linux_x64: "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb",
    linux_arm64: "e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080",
    darwin_x64: "dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709",
    darwin_arm64: "b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5",
  },
};

const platform = `${process.platform}_${process.arch === "x64" ? "x64" : process.arch}`;
const sha = GITLEAKS.sha256[platform];
if (!sha) {
  console.error(`gitleaks: no pinned build for ${platform}`);
  process.exit(1);
}
const file = `gitleaks_${GITLEAKS.version}_${platform}.tar.gz`;
const url = `https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS.version}/${file}`;
const res = await fetch(url, { redirect: "follow" });
if (!res.ok) throw new Error(`${url} answered ${res.status}`);
const body = Buffer.from(await res.arrayBuffer());
const got = createHash("sha256").update(body).digest("hex");
if (got !== sha) {
  console.error(`gitleaks: checksum mismatch for ${file}\n  expected ${sha}\n  got      ${got}`);
  process.exit(1);
}
const tmp = mkdtempSync(join(tmpdir(), "weave-tools-"));
writeFileSync(join(tmp, file), body);
const bin = join(ROOT, ".tools", "bin");
mkdirSync(bin, { recursive: true });
execFileSync("tar", ["-xzf", join(tmp, file), "-C", bin, "gitleaks"]);
chmodSync(join(bin, "gitleaks"), 0o755);
console.log(`gitleaks ${GITLEAKS.version} → ${join(bin, "gitleaks")} (sha256 verified)`);
