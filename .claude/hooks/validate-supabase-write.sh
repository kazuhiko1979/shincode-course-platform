#!/bin/bash
# PreToolUse guard for Supabase MCP write tools (docs/018).
# Blocks apply_migration and DDL/DML execute_sql (変更禁止ゾーン).
# SELECT / read-only queries are allowed.
# Override for human-approved writes: set env CLAUDE_ALLOW_DB_WRITE=1.
#
# exit 0 = allow, exit 2 = block. JSON parsed with node (jq absent here).

# Human-approved override.
[ "${CLAUDE_ALLOW_DB_WRITE:-}" = "1" ] && exit 0

input=$(cat)

# node emits two lines: line1 = tool_name, line2 = query (whitespace flattened),
# so an empty tool_name is detected reliably (read splitting can't merge them).
{ read -r tool; read -r query; } < <(printf '%s' "$input" | node -e '
  let raw=""; process.stdin.on("data",d=>raw+=d);
  process.stdin.on("end",()=>{
    let t="",q="";
    try { const j=JSON.parse(raw); t=j.tool_name||""; q=(j.tool_input&&(j.tool_input.query||""))||""; } catch(e){}
    process.stdout.write(String(t).replace(/\s+/g," ")+"\n"+String(q).replace(/\s+/g," "));
  });
' 2>/dev/null)

block() {
  echo "🛑 BLOCKED by .claude/hooks/validate-supabase-write.sh: $1" >&2
  echo "BLOCKED: $1 — DB スキーマ/データ変更は変更禁止ゾーンです。人間の承認を得たうえで、承認済みなら CLAUDE_ALLOW_DB_WRITE=1 を付けて実行してください。"
  exit 2
}

# fail-closed: this hook only fires on write tools (matcher), so if the tool
# name could not be parsed, deny rather than allow.
[ -z "$tool" ] && block "解析不能の Supabase 書き込み（fail-closed）"

case "$tool" in
  *apply_migration)
    block "apply_migration（マイグレーション適用）" ;;
  *execute_sql)
    if printf '%s' "$query" | grep -Eiq '\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE|GRANT|REVOKE|REPLACE)\b'; then
      block "execute_sql の DDL/DML"
    fi ;;
esac

exit 0
