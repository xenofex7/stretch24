#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────
# deploy.sh - Automated release pipeline
#
# Usage:
#   ./scripts/deploy.sh          # auto-increment patch (0.6.5 -> 0.6.6)
#   ./scripts/deploy.sh patch    # auto-increment patch (0.6.5 -> 0.6.6)
#   ./scripts/deploy.sh minor    # auto-increment minor (0.6.5 -> 0.7.0)
#   ./scripts/deploy.sh major    # auto-increment major (0.6.5 -> 1.0.0)
#   ./scripts/deploy.sh v0.2.0   # explicit version
#
# Flags:
#   -q, --quiet   Do not stream the CI run output. Just block until the run
#                 finishes; on failure, write the failed-step log to a file
#                 and print only its path. Saves tokens when Claude runs this
#                 script, because the full streaming watch output is not piped
#                 back into the conversation.
#
# Steps:
#   1. Validate version argument or auto-increment patch
#   2. Check for clean working tree
#   3. Run the consistency check
#   4. Verify the service worker cache version was bumped
#   5. Generate CHANGELOG entry from git log
#   6. Commit changelog
#   7. Create git tag
#   8. Push commit + tag to origin
#   9. Create GitHub Release (optional, via CREATE_GITHUB_RELEASE)
#
# This project has no package.json on purpose (no framework, no build step).
# The version therefore lives in git tags alone, not in a manifest file.
# ─────────────────────────────────────────────────────────

# ── Config (set during /deploy init) ──────────────────────
# Project description used as context for the changelog prompt.
PROJECT_DESCRIPTION="a free web app with guided stretching exercises, running entirely in the browser"
# Whether to create a GitHub Release after pushing the tag.
CREATE_GITHUB_RELEASE=true

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ── 0. Parse flags ────────────────────────────────────────
QUIET=0
POSITIONAL=()
for arg in "$@"; do
  case "$arg" in
    -q|--quiet) QUIET=1 ;;
    *) POSITIONAL+=("$arg") ;;
  esac
done
set -- "${POSITIONAL[@]+"${POSITIONAL[@]}"}"

# ── 1. Validate version argument or auto-increment ───────
VERSION="${1:-}"
# Source of truth is the latest git tag; 0.0.0 means "no release yet".
CURRENT_VERSION=$(git describe --tags --abbrev=0 2>/dev/null | sed 's/^v//' || echo "")
[[ -z "$CURRENT_VERSION" ]] && CURRENT_VERSION="0.0.0"

if [[ -z "$VERSION" || "$VERSION" == "patch" || "$VERSION" == "minor" || "$VERSION" == "major" ]]; then
  BUMP="${VERSION:-patch}"
  IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
  case "$BUMP" in
    patch) PATCH=$((PATCH + 1)) ;;
    minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
    major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  esac
  SEMVER="${MAJOR}.${MINOR}.${PATCH}"
  TAG="v${SEMVER}"
  info "Auto-incrementing ${BUMP} version"
elif [[ "$VERSION" =~ ^v?([0-9]+\.[0-9]+\.[0-9]+)$ ]]; then
  SEMVER="${BASH_REMATCH[1]}"
  TAG="v${SEMVER}"
else
  error "Invalid version format: $VERSION (expected vX.Y.Z, patch, minor, or major)"
fi

info "Current version: ${CURRENT_VERSION}"
info "New version:     ${SEMVER} (tag: ${TAG})"
echo ""

# ── 2. Check working tree ─────────────────────────────────
if [[ -n "$(git status --porcelain)" ]]; then
  error "Working tree is not clean. Commit or stash your changes first."
fi

BRANCH=$(git branch --show-current)
if [[ "$BRANCH" != "main" ]]; then
  warn "You are on branch '${BRANCH}', not 'main'. Continue? (y/N)"
  read -r CONFIRM
  [[ "$CONFIRM" =~ ^[yY]$ ]] || exit 0
fi

ok "Working tree is clean (branch: ${BRANCH})"

# ── 3. Consistency check ──────────────────────────────────
# Exercises, images, thumbs, precache list, prompts and all six languages
# have to line up. Same check that runs in CI.
info "Running consistency check..."
node tools/check-consistency.mjs
ok "Consistency check passed"

# ── 4. Service worker cache version ───────────────────────
# The service worker is cache-first: without a bumped CACHE constant users
# keep the old app forever. Warn if app files changed since the last tag
# but sw.js did not.
if [[ "$CURRENT_VERSION" != "0.0.0" ]]; then
  CHANGED_APP=$(git diff --name-only "v${CURRENT_VERSION}..HEAD" -- assets index.html manifest.webmanifest 2>/dev/null || echo "")
  CHANGED_SW=$(git diff --name-only "v${CURRENT_VERSION}..HEAD" -- sw.js 2>/dev/null || echo "")
  if [[ -n "$CHANGED_APP" && -z "$CHANGED_SW" ]]; then
    warn "App files changed since v${CURRENT_VERSION}, but sw.js did not."
    warn "Users would keep the cached old version. Bump CACHE in sw.js first."
    warn "Continue anyway? (y/N)"
    read -r CONFIRM
    [[ "$CONFIRM" =~ ^[yY]$ ]] || exit 0
  else
    ok "Service worker cache version is in sync"
  fi
fi

# ── 5. Generate CHANGELOG entry ───────────────────────────
info "Generating changelog entry..."

# Find the previous tag (if any)
PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [[ -n "$PREV_TAG" ]]; then
  COMMIT_RANGE="${PREV_TAG}..HEAD"
  info "Commits since ${PREV_TAG}:"
else
  COMMIT_RANGE="HEAD"
  info "All commits (no previous tag found):"
fi

# Collect raw commit messages
COMMITS=""
while IFS= read -r line; do
  msg="${line#* }" # strip hash
  # Skip release commits and trivial changes
  case "$msg" in
    Release\ v*|Merge\ *) continue ;;
  esac
  COMMITS+="${msg}"$'\n'
done < <(git log "$COMMIT_RANGE" --oneline --no-merges 2>/dev/null || git log --oneline --no-merges)

TODAY=$(date +%Y-%m-%d)

# Use Claude CLI to generate a user-friendly changelog (if available)
if command -v claude &> /dev/null && [[ -n "$COMMITS" ]]; then
  info "Generating user-friendly changelog with Claude..."

  PROMPT="You are writing the changelog for ${PROJECT_DESCRIPTION}.

Based on these git commits, write a short, user-facing changelog section in English.

Commits:
${COMMITS}

Rules:
- Write from the user's perspective, NOT technically (no code, frameworks, tests, databases)
- Use these categories (only when applicable, omit empty ones): ### Added, ### Changed, ### Fixed
- Each entry starts with '- ' and describes what changes for the user
- Maximum 5-8 entries total, summarize when needed
- No duplicates, no trivial changes (e.g. .gitignore, README)
- No introductory text, only the ### categories with entries
- Good example: '- Vacation entries can now be edited directly from the employee dialog'
- Bad example: '- Fix TypeScript types in allocation reducer'"

  CHANGELOG_BODY=$(echo "$PROMPT" | claude --print 2>/dev/null || echo "")

  # The CLI exits 0 even when it only prints an error (wrong model, no access,
  # rate limit). A real changelog always contains a '### ' category heading -
  # without one, treat the output as failed and fall back to the commit list.
  if ! grep -q '^### ' <<< "$CHANGELOG_BODY"; then
    [[ -n "$CHANGELOG_BODY" ]] && warn "Claude returned no changelog: ${CHANGELOG_BODY:0:100}"
    CHANGELOG_BODY=""
  fi

  if [[ -n "$CHANGELOG_BODY" ]]; then
    CHANGELOG_ENTRY="## [${SEMVER}] - ${TODAY}"$'\n\n'"${CHANGELOG_BODY}"
    ok "Changelog generated by Claude"
  else
    warn "Claude generation failed, falling back to commit-based changelog"
    CHANGELOG_BODY="### Changed"
    while IFS= read -r line; do
      [[ -n "$line" ]] && CHANGELOG_BODY+=$'\n'"- ${line}"
    done <<< "$COMMITS"
    CHANGELOG_ENTRY="## [${SEMVER}] - ${TODAY}"$'\n\n'"${CHANGELOG_BODY}"
  fi
else
  # Fallback: use commit messages directly
  CHANGELOG_BODY="### Changed"
  while IFS= read -r line; do
    [[ -n "$line" ]] && CHANGELOG_BODY+=$'\n'"- ${line}"
  done <<< "$COMMITS"
  CHANGELOG_ENTRY="## [${SEMVER}] - ${TODAY}"$'\n\n'"${CHANGELOG_BODY}"
fi

# ── Derive a one-line slogan for the commit message ───────
SLOGAN=""
if command -v claude &> /dev/null && [[ -n "${CHANGELOG_BODY:-}" ]]; then
  SLOGAN_PROMPT="Summarize this changelog as a single short slogan (max 60 chars, no trailing period, no quotes, no markdown). Just the summary line, nothing else.

${CHANGELOG_BODY}"
  SLOGAN=$(echo "$SLOGAN_PROMPT" | claude --print 2>/dev/null | head -1 | tr -d '"' | sed 's/[[:space:]]*$//' || echo "")
  # Same trap as above: an error message is not a slogan. Anything longer than
  # the requested 60 characters did not follow the prompt.
  [[ ${#SLOGAN} -gt 60 ]] && SLOGAN=""
fi
# Fallback: first bullet of the changelog, trimmed
if [[ -z "$SLOGAN" ]]; then
  SLOGAN=$(echo "${CHANGELOG_BODY:-}" | grep -m1 '^- ' | sed 's/^- //' | cut -c1-60)
fi
# Last-resort fallback: generic
[[ -z "$SLOGAN" ]] && SLOGAN="maintenance release"

# Insert new entry after [Unreleased] header, clearing the unreleased section
if [[ -f CHANGELOG.md ]]; then
  # Build the new changelog content using sed + temp file to avoid awk newline issues
  TEMP_FILE=$(mktemp)
  ENTRY_FILE=$(mktemp)
  echo "$CHANGELOG_ENTRY" > "$ENTRY_FILE"

  # Find the [Unreleased] line, insert entry after it, skip old unreleased content
  awk '
    /^## \[Unreleased\]/ {
      print $0
      print ""
      while ((getline line < "'"$ENTRY_FILE"'") > 0) print line
      skip = 1
      next
    }
    skip && /^## \[/ {
      skip = 0
    }
    !skip { print }
  ' CHANGELOG.md > "$TEMP_FILE"

  mv "$TEMP_FILE" CHANGELOG.md
  rm -f "$ENTRY_FILE"
  ok "CHANGELOG.md updated"
else
  # Create new changelog
  cat > CHANGELOG.md << EOF
# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

${CHANGELOG_ENTRY}
EOF
  ok "CHANGELOG.md created"
fi

# Show the entry
echo ""
echo -e "${CYAN}── Changelog Entry ──────────────────────${NC}"
echo "$CHANGELOG_ENTRY"
echo -e "${CYAN}─────────────────────────────────────────${NC}"
echo ""

# ── 6. Commit ─────────────────────────────────────────────
info "Committing changelog..."
git add CHANGELOG.md
git commit -m "$(cat <<EOF
Release ${TAG}: ${SLOGAN}

- Update CHANGELOG with release notes
EOF
)"
ok "Committed"

# ── 7. Create git tag ─────────────────────────────────────
info "Creating tag ${TAG}..."
git tag -a "$TAG" -m "Release ${TAG}"
ok "Tag ${TAG} created"

# ── 8. Push and create GitHub Release ─────────────────────
info "Pushing to origin..."
git push origin "$BRANCH"
git push origin "$TAG"
ok "Pushed commit and tag"

# Create GitHub Release (requires gh CLI, controlled by CREATE_GITHUB_RELEASE)
if [[ "${CREATE_GITHUB_RELEASE}" == "true" ]]; then
  if command -v gh &> /dev/null; then
    info "Creating GitHub Release..."

    # Build release notes from changelog entry
    RELEASE_NOTES="$CHANGELOG_ENTRY"

    gh release create "$TAG" \
      --title "Release ${TAG}: ${SLOGAN}" \
      --notes "$RELEASE_NOTES" \
      --latest

    ok "GitHub Release created"
  else
    warn "gh CLI not installed - create the release manually on GitHub"
    warn "Go to: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/releases/new?tag=${TAG}"
  fi
else
  info "GitHub Release skipped (CREATE_GITHUB_RELEASE=false)"
fi

# ── 9. Watch the CI run triggered by the push (optional) ─
# Set WATCH_CI=0 to skip; default is to watch and exit non-zero if CI fails.
if command -v gh &> /dev/null && [[ "${WATCH_CI:-1}" != "0" ]]; then
  info "Waiting briefly for CI to register the run..."
  sleep 4
  RUN_ID=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || echo "")
  if [[ -n "$RUN_ID" ]]; then
    if [[ "$QUIET" == "1" ]]; then
      # Quiet mode: poll status only, no streaming output.
      # On failure, dump the failed-step log to a file and print just the path.
      LOG_FILE=".deploy-ci-${RUN_ID}.log"
      info "Watching CI run #${RUN_ID} (quiet, log on failure: ${LOG_FILE})..."
      while true; do
        STATE=$(gh run view "$RUN_ID" --json status,conclusion --jq '.status + "|" + (.conclusion // "")' 2>/dev/null || echo "|")
        RUN_STATUS="${STATE%|*}"
        RUN_CONCLUSION="${STATE#*|}"
        if [[ "$RUN_STATUS" == "completed" ]]; then
          if [[ "$RUN_CONCLUSION" == "success" ]]; then
            ok "CI passed"
          else
            gh run view "$RUN_ID" --log-failed > "$LOG_FILE" 2>&1 || true
            echo ""
            warn "CI FAILED (conclusion: ${RUN_CONCLUSION:-unknown})"
            warn "Log: ${LOG_FILE}  (or live: gh run view ${RUN_ID} --log-failed)"
            echo ""
            echo "  The tag and release exist on GitHub, but the build pipeline did not"
            echo "  succeed. Fix the issue and push a patch release."
            exit 1
          fi
          break
        fi
        sleep 15
      done
    else
      info "Watching CI run #${RUN_ID}..."
      if gh run watch "$RUN_ID" --exit-status --interval 10; then
        ok "CI passed"
      else
        echo ""
        warn "CI FAILED - inspect with: gh run view ${RUN_ID} --log-failed"
        echo ""
        echo "  The tag and release exist on GitHub, but the build pipeline did not"
        echo "  succeed. Fix the issue and push a patch release."
        exit 1
      fi
    fi
  else
    warn "No CI run found to watch (gh run list returned nothing)"
  fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Release ${TAG} complete!${NC}"
echo -e "${GREEN}  ${SLOGAN}${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
