#!/bin/bash
# PostToolUse — run eslint on edited JS/TS files and feed problems back to the
# active agent (Claude Code Write/Edit or Codex apply_patch).
# Feedback only — never blocks. jq absent → paths parsed with node.

input=$(cat)

files=$(printf '%s' "$input" | node -e '
  let raw=""; process.stdin.on("data",d=>raw+=d);
  process.stdin.on("end",()=>{
    const files=new Set();
    try {
      const j=JSON.parse(raw);
      const direct=(j.tool_input&&j.tool_input.file_path)
        || (j.tool_response&&j.tool_response.filePath);
      if (direct) files.add(String(direct));
      const patch=(j.tool_input&&j.tool_input.command)||"";
      for (const match of String(patch).matchAll(/^\*\*\* (?:Add|Update) File: (.+)$/gm)) {
        files.add(match[1]);
      }
    } catch(e){}
    process.stdout.write([...files].join("\n"));
  });
' 2>/dev/null)

[ -z "$files" ] && exit 0

dir="${CLAUDE_PROJECT_DIR:-${CODEX_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}}"
bin="$dir/node_modules/.bin/eslint"
[ -x "$bin" ] || exit 0

printf '%s\n' "$files" | while IFS= read -r file; do
  case "$file" in
    *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs) ;;
    *) continue ;;
  esac

  case "$file" in
    /*) target="$file" ;;
    *) target="$dir/$file" ;;
  esac
  [ -f "$target" ] || continue

  out=$("$bin" "$target" 2>&1)
  if [ -n "$out" ]; then
    echo "⚠️ eslint に指摘があります（$file）。編集を続ける前に確認してください："
    echo "$out"
  fi
done
exit 0
