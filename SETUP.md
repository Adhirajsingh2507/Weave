# Setting up Weave on a new device

Step by step, for Linux, macOS and Windows. Everything in **Required** is needed to build Weave,
run its 32 self-checks and run the demo. Everything in **Optional** unlocks one capability; skip
what you do not need. Each step says what it is for.

_Last updated: 2026-09-30. Describes what works today; planned items are marked **(planned)**._

## What each piece is for

| Tool | Needed for | Required? |
|---|---|---|
| git | cloning; Weave uses git worktrees to isolate every agent | yes |
| Node.js ≥ 22.6 (24 LTS recommended) | Weave itself | yes |
| pnpm 9.15 | installing and running Weave | yes |
| C/C++ build tools | only if `better-sqlite3` has no prebuilt binary for your machine | fallback |
| GitHub CLI (`gh`) | cloning the private repo; `pnpm ship` | yes (private repo) |
| Claude Code (`claude`) + a Claude subscription | real builds by real agents | for real runs |
| Chrome or Chromium | rendering built pages for screenshots and visual QA | optional |
| bubblewrap (Linux) | the OS sandbox that hides secrets from agents | optional, recommended |
| Vercel CLI | deploying the built site | optional |
| tmux **(planned)** | watching and stepping into agents, one window each | planned |

## 1. Base tools

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y git curl build-essential python3   # build tools are the fallback for native modules
# Node.js 24 via nvm (no root needed, easy to switch versions)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
exec $SHELL                                            # reload the shell so `nvm` exists
nvm install 24
corepack enable                                        # ships with Node; provides pnpm
corepack prepare pnpm@9.15.0 --activate
```

GitHub CLI: follow <https://github.com/cli/cli/blob/trunk/docs/install_linux.md> (adds GitHub's apt repository), then `sudo apt install gh`.

### macOS

```bash
xcode-select --install                                 # compilers, for native modules if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install git node@24 gh
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

If `node --version` is not 24 after installing, follow the `brew info node@24` note to put it on your PATH.

### Windows

Weave runs inside **WSL2** (Linux inside Windows). The git worktrees, the sandbox and the
shell tooling all assume a Unix environment.

1. In PowerShell as Administrator: `wsl --install -d Ubuntu`, then restart.
2. Open **Ubuntu** from the Start menu, create your Linux user.
3. Follow the **Linux** steps above inside Ubuntu. Keep the project inside the Linux file system
   (e.g. `~/projects`), not under `/mnt/c` — it is much faster and file permissions behave.

### Check

```bash
git --version && node --version && pnpm --version && gh --version
```

Node must print v22.6 or later; pnpm must print 9.15.x.

## 2. Get the code

The repository is private, so log in to GitHub first.

```bash
gh auth login                  # choose GitHub.com, HTTPS, and log in with the browser
mkdir -p ~/projects && cd ~/projects
gh repo clone Adhirajsingh2507/Weave autodesign
cd autodesign
```

## 3. Install, build, verify

```bash
pnpm install --frozen-lockfile   # exactly the versions in pnpm-lock.yaml
pnpm build                       # TypeScript → dist/
pnpm check                       # 32 self-checks — all offline, no accounts needed
node scripts/check-design.mjs    # validates the 91 design guides
pnpm demo                        # the end-to-end run with stand-in agents, no accounts needed
node dist/cli/index.js doctor    # can this machine run the real demo? (one real model call;
                                 # --offline skips it) — names each failing item and its fix
```

If `pnpm install` fails compiling `better-sqlite3`, install the build tools from step 1 and run
it again.

`pnpm check` prints one line per check. A few say "NOT verified here" — that means an optional
tool is missing (for example the sandbox without bubblewrap), not that something is broken.

To use `weave` as a command instead of `node dist/cli/index.js`:

```bash
pnpm link --global
weave --help
```

## 4. Optional capabilities

### Real builds with Claude (subscription)

```bash
npm install -g @anthropic-ai/claude-code
claude                           # opens a login; use your Claude subscription account
```

Real builds then run as `weave run …` (see the README). Agents use your subscription login.
Weave does not need an API key for this.

> **Do not set `ANTHROPIC_API_KEY` for subscription use.** If it is set, Claude Code uses the key
> instead of your login and bills per token. Weave will stop passing it to agents **(planned, D0)**.

### Rendering pages (browser QA)

- **Linux:** `sudo apt install -y chromium` (or install Google Chrome from google.com/chrome).
- **macOS:** install Google Chrome, or `brew install --cask chromium`.
- **WSL2:** install Chromium inside Ubuntu as for Linux.

Check: `weave sandbox` does not cover this; run `pnpm check` and look for
`visual placement check passed … real Chrome render verified`.

### The OS sandbox

- **Linux / WSL2:** `sudo apt install -y bubblewrap`, then `weave sandbox` should print `bwrap: …`.
  On Ubuntu 24.04+, if it reports that user namespaces are restricted, allow them for bubblewrap
  (see Ubuntu's AppArmor documentation for `unprivileged_userns`) or run without the OS sandbox —
  Weave records which it did on every node.
- **macOS:** **(planned)** a macOS sandbox backend. Until then runs are recorded as unsandboxed;
  Claude Code's own deny rules and the egress allowlist still apply.

### Deploying (Vercel)

```bash
npm install -g vercel
vercel login
```

Then `WEAVE_DEPLOY=vercel` makes pre-release approval deploy. The Vercel login is never visible
to agents.

### Publishing changes to GitHub

`pnpm ship "message"` builds, runs every check, and only then commits and pushes. It needs `gh`
logged in (step 2).

## 5. You are ready when

- [ ] `pnpm check` passes (32 checks)
- [ ] `node scripts/check-design.mjs` passes
- [ ] `pnpm demo` ends with `✓ demo complete`
- [ ] for real runs: `claude` opens logged in to your subscription
- [ ] optional: `weave sandbox` prints `bwrap` (Linux/WSL2)
- [ ] optional: `vercel whoami` prints your account

## Accounts at a glance

| Account | Used for | Where it lives |
|---|---|---|
| GitHub | cloning the private repo, `pnpm ship` | `gh auth login` |
| Claude subscription | real agent builds; decisions and vision **(planned, D1)** | `claude` login |
| Vercel | public deploys | `vercel login` |
| Anthropic API key | optional API mode **(planned)** — billed per token | `ANTHROPIC_API_KEY`, never in the repo |
| Jev | decision provider **(planned, D8 — waiting on docs)** | an environment variable, never in the repo |

Never commit keys or tokens. `.env` files are ignored by git, and agents cannot read them when the
sandbox is on.
