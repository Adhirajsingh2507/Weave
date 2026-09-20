#!/usr/bin/env bash
# Auto-deploy Weave to GitHub.
# First run: creates the private GitHub repo + 'origin' remote.
# Every run: git add -A -> commit -> push (keeps GitHub in sync).
#
# Usage:
#   ./scripts/deploy.sh ["commit message"]
# Env overrides:
#   WEAVE_REPO=<name>            (default: Weave)
#   WEAVE_VISIBILITY=private|public  (default: private)

set -euo pipefail

REPO_NAME="${WEAVE_REPO:-Weave}"
VISIBILITY="${WEAVE_VISIBILITY:-private}"
MSG="${1:-chore: sync $(date -u +%Y-%m-%dT%H:%M:%SZ)}"

# Move to the repo root (parent of this script's directory).
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --- Preflight ---
command -v git  >/dev/null || { echo "error: git not found" >&2; exit 1; }
command -v pnpm >/dev/null || { echo "error: pnpm not found — https://pnpm.io" >&2; exit 1; }
command -v gh   >/dev/null || { echo "error: GitHub CLI (gh) not found — https://cli.github.com" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "error: gh not authenticated — run: gh auth login" >&2; exit 1; }

case "$VISIBILITY" in
  private|public) ;;
  *) echo "error: WEAVE_VISIBILITY must be 'private' or 'public' (got '$VISIBILITY')" >&2; exit 1 ;;
esac

# --- Ensure a git repo on a named branch ---
if [ ! -d .git ]; then
  git init -q
  git symbolic-ref HEAD refs/heads/main
fi
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
if [ "$BRANCH" = "HEAD" ]; then
  BRANCH=main
  git symbolic-ref HEAD refs/heads/main
fi

# --- Verify: build + checks must pass before publishing (never push a broken tree) ---
if [ ! -d node_modules ]; then
  echo "• installing deps…"
  pnpm install --frozen-lockfile
fi
echo "• building…";  pnpm build
echo "• checking…";  pnpm check
echo "• build + checks passed"

# --- Stage + commit (skip cleanly if nothing changed) ---
git add -A
if git diff --cached --quiet; then
  echo "• no changes to commit"
else
  git commit -q -m "$MSG"
  echo "• committed: $MSG"
fi

# --- Ensure the GitHub repo + 'origin' remote exist (first run creates them) ---
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "• creating ${VISIBILITY} GitHub repo '${REPO_NAME}'…"
  gh repo create "$REPO_NAME" "--${VISIBILITY}" --source=. --remote=origin
fi

# --- Push ---
git push -u origin "$BRANCH"
echo "✓ deployed to $(git remote get-url origin) [$BRANCH]"
