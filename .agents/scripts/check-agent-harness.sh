#!/usr/bin/env bash
# Read-only Claude Code / Codex harness and skill-quality smoke check.
set -uo pipefail

ROOT=""
QUIET=0
PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

pass() { PASS_COUNT=$((PASS_COUNT + 1)); [ "$QUIET" -eq 1 ] || printf 'PASS  %s\n' "$1"; }
warn() { WARN_COUNT=$((WARN_COUNT + 1)); printf 'WARN  %s\n' "$1"; }
fail() { FAIL_COUNT=$((FAIL_COUNT + 1)); printf 'FAIL  %s\n' "$1"; }

usage() { printf 'Usage: %s [--project PROJECT_DIR] [--quiet]\n' "$0" >&2; exit 2; }
while [ "$#" -gt 0 ]; do
  case "$1" in
    --project) [ "$#" -ge 2 ] || usage; ROOT="$2"; shift 2 ;;
    --quiet) QUIET=1; shift ;;
    *) usage ;;
  esac
done

if [ -z "$ROOT" ]; then ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true); fi
if [ -z "$ROOT" ] || [ ! -d "$ROOT" ]; then fail 'Git repository root'; exit 1; fi
ROOT=$(cd "$ROOT" && pwd)
cd "$ROOT" 2>/dev/null || { fail 'Change to project root'; exit 1; }

require_file() {
  local file="$1"
  if [ -f "$file" ]; then pass "File: $file"; else fail "File: $file"; fi
}
require_exec() {
  local file="$1"
  if [ -x "$file" ]; then pass "Executable: $file"; else fail "Executable: $file"; fi
}
require_json() {
  local file="$1"
  if node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' "$file" >/dev/null 2>&1; then pass "Valid JSON: $file"; else fail "Valid JSON: $file"; fi
}
require_text() {
  local file="$1" text="$2"
  if rg -Fq "$text" "$file"; then pass "Content: $file contains $text"; else fail "Content: $file contains $text"; fi
}
require_link() {
  local link="$1" target="$2"
  if [ -L "$link" ] && [ "$(readlink -f "$link" 2>/dev/null || true)" = "$ROOT/$target" ]; then pass "Symlink: $link"; else fail "Symlink: $link -> $target"; fi
}

require_file .claude/settings.json
require_file .codex/hooks.json
require_file .codex/config.toml
require_json .claude/settings.json
require_json .codex/hooks.json

if [ -d .claude/agents ] && [ "$(find .claude/agents -maxdepth 1 -type f -name '*.md' | wc -l)" -gt 0 ]; then pass 'Claude agents'; else fail 'Claude agents'; fi
if [ -d .claude/commands ] && [ "$(find .claude/commands -maxdepth 1 -type f -name '*.md' | wc -l)" -gt 0 ]; then pass 'Claude commands'; else fail 'Claude commands'; fi

for hook in lint-on-save.sh notify.sh session-start.sh validate-bash.sh validate-supabase-write.sh; do
  require_exec ".agents/hooks/$hook"
  require_link ".claude/hooks/$hook" ".agents/hooks/$hook"
done
for link in .claude/rules/backend .claude/rules/frontend .claude/skills/material-design; do
  require_link "$link" ".agents/${link#.claude/}"
done

for skill in carve-it grill-me; do require_file ".agents/skills/$skill/SKILL.md"; done

CARVE=.agents/skills/carve-it/SKILL.md
if [ -f "$CARVE" ]; then
  description=$(sed -n '3p' "$CARVE" | sed 's/^description: //')
  body_lines=$(awk 'BEGIN{frontmatter=0} /^---$/{if(frontmatter==0){frontmatter=1;next} if(frontmatter==1){exit}} frontmatter{n++} END{print n+0}' "$CARVE")
  description_chars=$(printf '%s' "$description" | wc -m)
  if [ "$body_lines" -le 500 ]; then pass "Context bloat: carve-it body ${body_lines} lines"; else fail "Context bloat: carve-it body ${body_lines} lines"; fi
  if [ "$description_chars" -le 700 ]; then pass "Context bloat: description ${description_chars} chars"; else fail "Context bloat: description ${description_chars} chars"; fi
  for trigger in 'carve-it' '300行以上' '8ファイル以上' '複数レイヤー'; do require_text "$CARVE" "$trigger"; done
  require_text "$CARVE" 'コミットを求められていない場合'
  require_text "$CARVE" '公開済みなら履歴を改変せず'
else
  fail 'carve-it skill for quality evaluation'
fi

for agent in security_reviewer code_reviewer performance_reviewer; do
  file=".codex/agents/$agent.toml"
  require_file "$file"
  if [ -f "$file" ] && grep -Eq '^name[[:space:]]*=' "$file" && grep -Eq '^description[[:space:]]*=' "$file" && grep -Eq '^developer_instructions[[:space:]]*=' "$file" && grep -Eq '^sandbox_mode[[:space:]]*=[[:space:]]*"read-only"' "$file" && grep -Eq '^approval_policy[[:space:]]*=[[:space:]]*"never"' "$file"; then
    pass "Tool gating: Codex agent $agent is read-only"
  else
    fail "Tool gating: Codex agent $agent"
  fi
done

require_text .codex/hooks.json 'bash .agents/hooks/validate-bash.sh'
require_text .codex/hooks.json 'bash .agents/hooks/validate-supabase-write.sh'
require_text .claude/settings.json 'validate-bash.sh'
require_text .claude/settings.json 'validate-supabase-write.sh'

if command -v codex >/dev/null 2>&1 && codex --strict-config --version >/dev/null 2>&1; then pass 'Codex strict config'; else warn 'Codex strict config unavailable (CLI or environment issue)'; fi

if [ -x .agents/hooks/validate-bash.sh ]; then
  if printf '%s' '{"tool_input":{"command":"printf smoke"}}' | .agents/hooks/validate-bash.sh >/dev/null 2>&1; then pass 'Tool gating: safe Bash command allowed'; else fail 'Tool gating: safe Bash command allowed'; fi
  if printf '%s' '{"tool_input":{"command":"rm -rf /"}}' | .agents/hooks/validate-bash.sh >/dev/null 2>&1; then fail 'Tool gating: destructive Bash command blocked'; else pass 'Tool gating: destructive Bash command blocked'; fi
fi
if [ -x .agents/hooks/validate-supabase-write.sh ]; then
  if printf '%s' '{"tool_name":"mcp__supabase__execute_sql","tool_input":{"query":"SELECT 1"}}' | .agents/hooks/validate-supabase-write.sh >/dev/null 2>&1; then pass 'Tool gating: read-only SQL allowed'; else fail 'Tool gating: read-only SQL allowed'; fi
  if printf '%s' '{"tool_name":"mcp__supabase__execute_sql","tool_input":{"query":"DELETE FROM example"}}' | .agents/hooks/validate-supabase-write.sh >/dev/null 2>&1; then fail 'Tool gating: SQL write blocked'; else pass 'Tool gating: SQL write blocked'; fi
fi

printf '\nHARNESS SUMMARY project=%s pass=%d warn=%d fail=%d\n' "$ROOT" "$PASS_COUNT" "$WARN_COUNT" "$FAIL_COUNT"
[ "$FAIL_COUNT" -eq 0 ]
