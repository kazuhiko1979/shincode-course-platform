#!/bin/bash
# PreToolUse guard for the Bash tool — deterministic blocks of destructive
# commands (docs/018 / harness principles §3 "失敗が許されない制御は Hooks で強制").
#
# exit 0 = allow, exit 2 = block. The block reason is written to BOTH stderr and
# stdout so it surfaces regardless of how the harness routes each stream.
# jq is not installed here, so the command string is parsed with node
# (guaranteed present in this Next.js repo). A cheap keyword prefilter avoids
# spawning node on the vast majority of Bash calls.
#
# To extend: add a "REGEX‖理由" line to DANGEROUS_PATTERNS below.

input=$(cat)

# --- fast path: no trigger keyword → allow without spawning node ---
printf '%s' "$input" | grep -Eq 'rm[[:space:]]|rmdir|git[[:space:]]+(add|push|reset|clean|checkout)|chmod|mkfs|dd[[:space:]]|/dev/|:\(\)|curl|wget|\.env|>[[:space:]]*/' || exit 0

# --- extract the command string precisely ---
cmd=$(printf '%s' "$input" | node -e '
  let raw=""; process.stdin.on("data",d=>raw+=d);
  process.stdin.on("end",()=>{
    try {
      const j=JSON.parse(raw);
      process.stdout.write((j.tool_input&&(j.tool_input.command||j.tool_input.cmd))||"");
    }
    catch(e){ process.stdout.write(""); }
  });
' 2>/dev/null)
[ -z "$cmd" ] && exit 0

# --- explicit list of destructive patterns: "ERE‖ユーザー向け理由" ---
# ‖ (U+2016) is the field separator so regexes may contain | freely.
DANGEROUS_PATTERNS=(
  ':\(\)[[:space:]]*\{[[:space:]]*:[[:space:]]*\|[[:space:]]*:‖フォークボム（:(){ :|:& };: ）は実行できません。'
  'rm[[:space:]].*--no-preserve-root‖rm --no-preserve-root は禁止です（ルート保護の無効化）。'
  'rm[[:space:]]+-[a-zA-Z]*[rf][a-zA-Z]*([[:space:]]+-[a-zA-Z]+)*[[:space:]]+(/|/\*|~|~/|\$HOME|\$HOME/|\.|\.\.|\*|\./|\.\./|\./\*)([[:space:]]|$)‖破滅的な rm（対象が / /* ~ $HOME . .. * ./ など）。削除は具体パスに限定してください（例: rm -rf node_modules は可）。'
  'rm[[:space:]].*--force.*[[:space:]](/|/\*|~|\$HOME|\*)([[:space:]]|$)‖破滅的な rm（ロング形式 --force が壊滅的パスを対象）。削除は具体パスに限定してください。'
  'rm[[:space:]].*--recursive.*[[:space:]](/|/\*|~|\$HOME|\*)([[:space:]]|$)‖破滅的な rm（ロング形式 --recursive が壊滅的パスを対象）。削除は具体パスに限定してください。'
  'sudo[[:space:]]+rm[[:space:]]‖sudo での削除は禁止です。'
  'git[[:space:]]+push.*([[:space:]]|^)(--force-with-lease|--force|-f)([[:space:]]|=|$)‖強制 push は禁止。push は /push-review 経由で通常 push を使ってください。'
  'git[[:space:]]+add[[:space:]]+(-A([[:space:]]|$)|--all([[:space:]]|$)|\.([[:space:]]|$))‖一括ステージ（-A/--all/.）は禁止。変更パスを明示してください。'
  'git[[:space:]]+add[[:space:]].*\.env‖.env* は絶対にステージしないでください（シークレット混入防止）。'
  'git[[:space:]]+reset[[:space:]]+--hard‖git reset --hard は未コミットの変更を破棄します。必要なら人間に確認してください。'
  'git[[:space:]]+clean[[:space:]]+-[a-zA-Z]*[fdx]‖git clean -fdx は未追跡/無視ファイルを破壊します。人間に確認してください。'
  'git[[:space:]]+checkout[[:space:]]+(-f([[:space:]]|$)|--force)‖git checkout --force は未コミットの変更を破棄します。人間に確認してください。'
  'chmod[[:space:]]+(-[a-zA-Z]*R[a-zA-Z]*[[:space:]]+)?777‖chmod 777 は過剰な権限付与です。必要最小限の権限にしてください。'
  'mkfs‖ファイルシステム作成（mkfs）は禁止です。'
  'dd[[:space:]]+.*of=/dev/‖ブロックデバイスへの dd 書き込みは禁止です。'
  '>[[:space:]]*/dev/(sd|nvme|hd|disk|mapper|vd)[a-z0-9]‖ブロックデバイスへのリダイレクトは禁止です（/dev/null 等は可）。'
  '(curl|wget)[[:space:]].*\|[[:space:]]*(sudo[[:space:]]+)?(sh|bash)([[:space:]]|$)‖ネットワークから取得したスクリプトのパイプ実行（curl|sh）は禁止です。内容を確認してから実行してください。'
)

for entry in "${DANGEROUS_PATTERNS[@]}"; do
  pat="${entry%%‖*}"
  reason="${entry#*‖}"
  if printf '%s' "$cmd" | grep -Eq "$pat"; then
    echo "🛑 BLOCKED by .agents/hooks/validate-bash.sh" >&2
    echo "   command: $cmd" >&2
    echo "   reason : $reason" >&2
    echo "BLOCKED（決定論的ガードレール）: $reason 実行コマンド: $cmd"
    exit 2
  fi
done

exit 0
