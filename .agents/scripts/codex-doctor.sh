#!/bin/bash
# Read-only Codex CLI harness diagnostics. Never prints config values, tokens,
# URLs, environment variables, or command output that may contain secrets.

set -uo pipefail

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

pass() { PASS_COUNT=$((PASS_COUNT + 1)); printf 'PASS  %s\n' "$1"; }
warn() { WARN_COUNT=$((WARN_COUNT + 1)); printf 'WARN  %s\n' "$1"; }
fail() { FAIL_COUNT=$((FAIL_COUNT + 1)); printf 'FAIL  %s\n' "$1"; }

agentMcpDisabled() {
  local file="$1"
  local table="$2"
  awk -v table="$table" '
    $0 == table {
      getline command
      getline enabled
      if (command ~ /^command[[:space:]]*=[[:space:]]*"false"$/ &&
          enabled ~ /^enabled[[:space:]]*=[[:space:]]*false$/) found=1
    }
    END { exit(found ? 0 : 1) }
  ' "$file"
}

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -z "$ROOT" ]; then
  fail "Git repository root"
  printf '\nSUMMARY pass=%d warn=%d fail=%d\n' "$PASS_COUNT" "$WARN_COUNT" "$FAIL_COUNT"
  exit 1
fi
cd "$ROOT" || exit 1
pass "Git repository root"

if command -v node >/dev/null 2>&1; then
  if node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>22||(a===22&&b>=18)?0:1)' >/dev/null 2>&1; then
    pass "Node.js >= 22.18"
  else
    fail "Node.js >= 22.18"
  fi
else
  fail "Node.js command"
fi

if command -v codex >/dev/null 2>&1 && codex --strict-config --version >/dev/null 2>&1; then
  pass "Codex strict config"
else
  fail "Codex strict config"
fi

if node -e '
const fs = require("fs");
const codex = JSON.parse(fs.readFileSync(".codex/hooks.json", "utf8")).hooks;
const claude = JSON.parse(fs.readFileSync(".claude/settings.json", "utf8")).hooks;
const has = (config, event, matcher, command) =>
  Array.isArray(config[event]) && config[event].some(group =>
    group.matcher === matcher && Array.isArray(group.hooks) &&
    group.hooks.some(hook => hook.type === "command" && hook.command === command));
if (!has(codex, "PreToolUse", "^(Bash|exec_command)$", "bash .agents/hooks/validate-bash.sh") ||
    !has(codex, "PreToolUse", "^mcp__supabase__(apply_migration|execute_sql)$", "bash .agents/hooks/validate-supabase-write.sh") ||
    !has(claude, "PreToolUse", "Bash", "bash \"${CLAUDE_PROJECT_DIR:-.}/.agents/hooks/validate-bash.sh\"") ||
    !has(claude, "PreToolUse", "mcp__supabase__apply_migration|mcp__supabase__execute_sql", "bash \"${CLAUDE_PROJECT_DIR:-.}/.agents/hooks/validate-supabase-write.sh\"")) process.exit(1);
' >/dev/null 2>&1; then
  pass "Required Hook guardrail wiring"
else
  fail "Required Hook guardrail wiring"
fi

HOOKS=(lint-on-save.sh notify.sh session-start.sh validate-bash.sh validate-supabase-write.sh)
for hook in "${HOOKS[@]}"; do
  if [ -x ".agents/hooks/$hook" ]; then pass "Executable hook: $hook"; else fail "Executable hook: $hook"; fi
  if [ -L ".claude/hooks/$hook" ] &&
     [ "$(readlink -f ".claude/hooks/$hook")" = "$ROOT/.agents/hooks/$hook" ]; then
    pass "Claude hook symlink: $hook"
  else
    fail "Claude hook symlink: $hook"
  fi
done

for link in .claude/rules/backend .claude/rules/frontend .claude/skills/material-design; do
  expected="$ROOT/.agents/${link#.claude/}"
  if [ -L "$link" ] && [ "$(readlink -f "$link")" = "$expected" ]; then
    pass "Shared symlink: $link"
  else
    fail "Shared symlink: $link"
  fi
done

AGENTS=(security_reviewer code_reviewer performance_reviewer)
REVIEWER_MCPS=(supabase github notion context7 playwright serena openaiDeveloperDocs '"chrome-devtools"')
for agent in "${AGENTS[@]}"; do
  file=".codex/agents/$agent.toml"
  allMcpsDisabled=true
  for server in "${REVIEWER_MCPS[@]}"; do
    if ! agentMcpDisabled "$file" "[mcp_servers.$server]"; then allMcpsDisabled=false; fi
  done
  if [ -f "$file" ] &&
     grep -Eq '^name[[:space:]]*=' "$file" &&
     grep -Eq '^description[[:space:]]*=' "$file" &&
     grep -Eq '^developer_instructions[[:space:]]*=' "$file" &&
     grep -Eq '^sandbox_mode[[:space:]]*=[[:space:]]*"read-only"' "$file" &&
     grep -Eq '^approval_policy[[:space:]]*=[[:space:]]*"never"' "$file" &&
     [ "$allMcpsDisabled" = true ] &&
     ! grep -Eq '(^|_)(url|token|http_headers)[[:space:]]*=' "$file"; then
    pass "Read-only Codex agent: $agent"
  else
    fail "Read-only Codex agent: $agent"
  fi
done

if grep -Eq '^approval_policy[[:space:]]*=[[:space:]]*"on-request"' .codex/config.toml &&
   grep -Eq '^sandbox_mode[[:space:]]*=[[:space:]]*"workspace-write"' .codex/config.toml &&
   awk -F= '
     /^\[agents\]$/ { inAgents=1; next }
     /^\[/ { inAgents=0 }
     inAgents && /^enabled[[:space:]]*=/ { gsub(/[[:space:]]/, "", $2); if ($2 == "true") enabled++ }
     inAgents && /^max_concurrent_threads_per_session[[:space:]]*=/ { gsub(/[[:space:]]/, "", $2); if ($2 == "6") threads++ }
     END { exit(enabled == 1 && threads == 1 ? 0 : 1) }
   ' .codex/config.toml; then
  pass "Project approval, sandbox, and reviewer concurrency"
else
  fail "Project approval, sandbox, and reviewer concurrency"
fi

MCP_LIST=$(codex mcp list 2>/dev/null || true)
EXPECTED_MCPS=(github supabase notion context7 playwright serena openaiDeveloperDocs chrome-devtools)
EXPECTED_MCP_NAMES=$(printf '%s\n' "${EXPECTED_MCPS[@]}" | sort)
ACTUAL_MCP_NAMES=$(printf '%s\n' "$MCP_LIST" | awk 'NF && $1 != "Name" { print $1 }' | sort)
if [ "$ACTUAL_MCP_NAMES" = "$EXPECTED_MCP_NAMES" ]; then
  pass "No unknown inherited MCP names"
else
  fail "No unknown inherited MCP names"
fi
declare -A EXPECTED_MCP_TYPES=(
  [github]=streamable_http [supabase]=streamable_http [notion]=streamable_http
  [openaiDeveloperDocs]=streamable_http [context7]=stdio [playwright]=stdio
  [serena]=stdio [chrome-devtools]=stdio
)
for server in "${EXPECTED_MCPS[@]}"; do
  MCP_JSON=$(codex mcp get "$server" --json 2>/dev/null || true)
  if printf '%s' "$MCP_JSON" | node -e '
    let input=""; process.stdin.on("data", chunk => input += chunk); process.stdin.on("end", () => {
      try { const value=JSON.parse(input); process.exit(value.enabled === true && value.transport?.type === process.argv[1] ? 0 : 1) }
      catch { process.exit(1) }
    })
  ' "${EXPECTED_MCP_TYPES[$server]}"; then
    pass "Enabled MCP name: $server"
  else
    fail "Enabled MCP name: $server"
  fi
  unset MCP_JSON
done
unset MCP_LIST EXPECTED_MCP_NAMES ACTUAL_MCP_NAMES

if [ -n "${CODEX_HOME:-}" ]; then
  GLOBAL_CONFIG="$CODEX_HOME/config.toml"
elif [ -n "${HOME:-}" ]; then
  GLOBAL_CONFIG="$HOME/.codex/config.toml"
else
  GLOBAL_CONFIG=""
fi
if [ -n "$GLOBAL_CONFIG" ] && [ -f "$GLOBAL_CONFIG" ] && grep -Eq '^notify[[:space:]]*=' "$GLOBAL_CONFIG"; then
  pass "Global notification configured"
else
  warn "Global notification configured"
fi
if [ -n "$GLOBAL_CONFIG" ] && [ -f "$GLOBAL_CONFIG" ] && grep -Eq '^status_line[[:space:]]*=' "$GLOBAL_CONFIG"; then
  pass "Global status line configured"
else
  warn "Global status line configured"
fi

warn "Interactive hook trust must be confirmed with /hooks after config changes"

printf '\nSUMMARY pass=%d warn=%d fail=%d\n' "$PASS_COUNT" "$WARN_COUNT" "$FAIL_COUNT"
[ "$FAIL_COUNT" -eq 0 ]
