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

# node emits three lines: tool_name, query (whitespace flattened), and whether
# the SQL contains a write/execute statement. Strings/comments are stripped
# before classification so read-only columns such as `comment` are not blocked.
{ read -r tool; read -r query; read -r is_write; } < <(printf '%s' "$input" | node -e '
  let raw=""; process.stdin.on("data",d=>raw+=d);
  process.stdin.on("end",()=>{
    let t="",q="";
    try { const j=JSON.parse(raw); t=j.tool_name||""; q=(j.tool_input&&(j.tool_input.query||""))||""; } catch(e){}
    function scrubSql(sql) {
      const SQ=String.fromCharCode(39), DQ=String.fromCharCode(34);
      let out="",state="normal",dollar="",blockDepth=0,backslashEscapes=false;
      for (let i=0;i<sql.length;i++) {
        const c=sql[i],n=sql[i+1]||"";
        if (state==="single") {
          if (backslashEscapes&&c==="\\"&&n) { out+="  "; i++; continue; }
          if (c===SQ&&n===SQ) { out+="  "; i++; continue; }
          if (c===SQ) state="normal";
          out+=" "; continue;
        }
        if (state==="double") {
          if (c===DQ&&n===DQ) { out+="  "; i++; continue; }
          if (c===DQ) state="normal";
          out+=" "; continue;
        }
        if (state==="line") {
          if (c==="\n"||c==="\r") { state="normal"; out+=c; } else out+=" ";
          continue;
        }
        if (state==="block") {
          if (c==="/"&&n==="*") { blockDepth++; out+="  "; i++; continue; }
          if (c==="*"&&n==="/") { blockDepth--; out+="  "; i++; if (blockDepth===0) state="normal"; continue; }
          out+=" "; continue;
        }
        if (state==="dollar") {
          if (sql.startsWith(dollar,i)) { out+=" ".repeat(dollar.length); i+=dollar.length-1; state="normal"; }
          else out+=" ";
          continue;
        }
        if (c===SQ) {
          const ePrefix=i>0&&/[eE]/.test(sql[i-1])&&(i<2||!/[$A-Z0-9_]/i.test(sql[i-2]));
          const uPrefix=i>1&&/[uU]/.test(sql[i-2])&&sql[i-1]==="&"&&(i<3||!/[$A-Z0-9_]/i.test(sql[i-3]));
          backslashEscapes=ePrefix||uPrefix; state="single"; out+=" "; continue;
        }
        if (c===DQ) { state="double"; out+=" "; continue; }
        if (c==="-"&&n==="-") { state="line"; out+="  "; i++; continue; }
        if (c==="/"&&n==="*") { state="block"; blockDepth=1; out+="  "; i++; continue; }
        if (c==="$") {
          const match=sql.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/);
          if (match) { dollar=match[0]; state="dollar"; out+=" ".repeat(dollar.length); i+=dollar.length-1; continue; }
        }
        out+=c;
      }
      return out;
    }
    const scrubbed=scrubSql(String(q));
    const statements=scrubbed.split(";").map(s=>s.trim()).filter(Boolean);
    const direct=/^(ALTER|DROP|CREATE|TRUNCATE|GRANT|REVOKE|REPLACE|CALL|DO|COPY|COMMENT|REFRESH|REINDEX|CLUSTER|VACUUM)\b/i;
    const dml=/(^|[^A-Z0-9_$])(INSERT|UPDATE|DELETE|MERGE)\b/i;
    const write=statements.some(s=>direct.test(s)||dml.test(s));
    process.stdout.write(String(t).replace(/\s+/g," ")+"\n"+String(q).replace(/\s+/g," ")+"\n"+(write?"1":"0"));
  });
' 2>/dev/null)

block() {
  echo "🛑 BLOCKED by .agents/hooks/validate-supabase-write.sh: $1" >&2
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
    if [ "$is_write" = "1" ]; then
      block "execute_sql の DDL/DML"
    fi ;;
esac

exit 0
