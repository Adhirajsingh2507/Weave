// V2.4 — enforcement outside the prompt (decision #48: the agent's native sandbox first, an OS
// sandbox as the fallback). A prompt sentence saying "do not read .env" is a request; this is
// the part that makes it true.
//
// Linux: bubblewrap. The agent keeps a normal view of the machine — its tools, its caches, its
// own config — minus three things:
//   - secrets in the user's home (ssh keys, cloud credentials, registry and deploy tokens);
//   - files in its worktree matching the context pack's deny globs;
//   - the user's own working tree. The agent works in a worktree; the real checkout, with its
//     untracked .env, is replaced by an empty directory. Only .git stays, because a worktree
//     cannot function without it.
//
// Where bubblewrap is missing or user namespaces are restricted, the backend is "none" and every
// node records that it ran unsandboxed. It never claims enforcement it does not have.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface SandboxInfo {
  backend: "bwrap" | "none";
  detail: string;
}

export interface SandboxPolicy {
  /** The node's worktree — where the agent runs. */
  worktreeDir: string;
  /** The user's repo, whose working tree is hidden from the agent. */
  repoPath?: string;
  /** Globs, relative to the worktree, whose matches become unreadable. */
  deny: string[];
}

/** Credentials in a home directory that no coding agent needs. Masked where present. */
export const HOME_SECRETS = [
  ".ssh",
  ".aws",
  ".azure",
  ".gnupg",
  ".kube",
  ".docker",
  ".config/gcloud",
  ".config/gh",
  ".netrc",
  ".npmrc",
  ".pypirc",
  ".git-credentials",
  ".vercel",
  ".local/share/com.vercel.cli",
];

let probed: SandboxInfo | undefined;

/** Can this machine run bubblewrap? Probed once per process. */
export function detectSandbox(): SandboxInfo {
  if (probed) return probed;
  try {
    execFileSync("bwrap", ["--ro-bind", "/", "/", "--dev", "/dev", "--proc", "/proc", "true"], {
      stdio: "ignore",
      timeout: 10_000,
    });
    probed = { backend: "bwrap", detail: "bubblewrap: home secrets and deny-listed files masked, repo working tree hidden" };
  } catch (e) {
    probed = {
      backend: "none",
      detail:
        (e as { code?: string }).code === "ENOENT"
          ? "unsandboxed: bubblewrap is not installed"
          : "unsandboxed: bubblewrap cannot create a namespace here (unprivileged user namespaces restricted?)",
    };
  }
  return probed;
}

/** `**` crosses directories, `*` and `?` do not. Anchored to the whole relative path. */
export function globToRegExp(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]!;
    if (c === "*" && glob[i + 1] === "*") {
      i++;
      if (glob[i + 1] === "/") {
        i++;
        re += "(?:.*/)?";
      } else {
        re += ".*";
      }
    } else if (c === "*") {
      re += "[^/]*";
    } else if (c === "?") {
      re += "[^/]";
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${re}$`);
}

/** Absolute paths under `dir` matching any deny glob. Skips .git and node_modules. */
export function deniedPaths(dir: string, deny: string[]): string[] {
  const patterns = deny.map(globToRegExp);
  const out: string[] = [];
  const walk = (abs: string, rel: string): void => {
    let entries;
    try {
      entries = readdirSync(abs, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name === ".git" || e.name === "node_modules") continue;
      const childRel = rel ? `${rel}/${e.name}` : e.name;
      const childAbs = join(abs, e.name);
      if (e.isDirectory()) walk(childAbs, childRel);
      else if (patterns.some((p) => p.test(childRel))) out.push(childAbs);
    }
  };
  walk(dir, "");
  return out;
}

/** bubblewrap arguments for a policy, without the command. */
export function sandboxArgs(policy: SandboxPolicy): string[] {
  const args = ["--die-with-parent", "--bind", "/", "/", "--dev", "/dev", "--proc", "/proc"];
  const mask = (path: string): void => {
    if (!existsSync(path)) return;
    if (statSync(path).isDirectory()) args.push("--tmpfs", path);
    else args.push("--ro-bind", "/dev/null", path);
  };
  if (policy.repoPath && existsSync(join(policy.repoPath, ".git"))) {
    args.push("--tmpfs", policy.repoPath, "--bind", join(policy.repoPath, ".git"), join(policy.repoPath, ".git"));
  }
  for (const rel of HOME_SECRETS) mask(join(homedir(), rel));
  for (const path of deniedPaths(policy.worktreeDir, policy.deny)) mask(path);
  args.push("--chdir", policy.worktreeDir);
  return args;
}

/** The command line that runs `cmd` inside the sandbox. */
export function wrapCommand(cmd: string, args: string[], policy: SandboxPolicy): { cmd: string; args: string[] } {
  return { cmd: "bwrap", args: [...sandboxArgs(policy), "--", cmd, ...args] };
}
