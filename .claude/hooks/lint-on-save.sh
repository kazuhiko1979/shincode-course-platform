#!/bin/bash
# PostToolUse (Write|Edit) — run eslint on the just-edited JS/TS file and feed
# any problems back to Claude for immediate self-correction (docs/019, 原則 §9).
# Feedback only — never blocks. jq absent → file path parsed with node.

input=$(cat)

file=$(printf '%s' "$input" | node -e '
  let raw=""; process.stdin.on("data",d=>raw+=d);
  process.stdin.on("end",()=>{
    let f="";
    try {
      const j=JSON.parse(raw);
      f=(j.tool_input&&j.tool_input.file_path)
        || (j.tool_response&&j.tool_response.filePath)
        || "";
    } catch(e){}
    process.stdout.write(String(f));
  });
' 2>/dev/null)

[ -z "$file" ] && exit 0

# Only lint JS/TS sources.
case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac

[ -f "$file" ] || exit 0

bin="${CLAUDE_PROJECT_DIR:-.}/node_modules/.bin/eslint"
[ -x "$bin" ] || exit 0

# Surface any eslint output (errors AND warnings); eslint prints nothing when
# the file is completely clean, so non-empty output means there is something to fix.
out=$("$bin" "$file" 2>&1)
if [ -n "$out" ]; then
  echo "⚠️ eslint に指摘があります（$file）。編集を続ける前に確認してください："
  echo "$out"
fi
exit 0
