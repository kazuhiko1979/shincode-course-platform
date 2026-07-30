# 019 PostToolUse lint-on-save ＋ 共有 Notification 音

ステータス：✅ 完了

## 目的

ハーネス原則 §9（検証ループ）・G-5 の実装。

1. **PostToolUse lint-on-save**（matcher `Write|Edit`）：ファイル編集直後に eslint を走らせ、**即時の決定論的フィードバック**を返す（reviewers は push 時の LLM レビューで別物、lint の代替にはならない）。JS/TS のみ対象。
2. **共有 Notification 音**：Claude が注意を要する時（Notification イベント）に音を鳴らす設定を、`~/.claude`（個人）ではなく **`.claude/settings.json`（チーム共有・Git 管理）** に置く。クロスプラットフォームで、音源が無ければ無害にスキップ。

## 設計判断（lint を 3 レビュアーで代替しない理由）

- 3 レビュアー（code/security/performance）は **push 時**の **LLM（確率的）** レビュー。lint は **編集直後・決定論的・高速** で役割が異なる。
- lint を LLM で代替するのは「決定論の仕事を LLM にやらせる」アンチパターン（原則 §9：まずルールベース）。
- lint はすでに `npm run verify` と CI で決定論的にカバー。PostToolUse が足すのは **fast-fail の即時ループ**。

## 実装

- `.claude/hooks/lint-on-save.sh`：stdin の `tool_input.file_path`（無ければ `tool_response.filePath`）を node で抽出。拡張子が `.ts/.tsx/.js/.jsx/.mjs/.cjs` の時だけ `node_modules/.bin/eslint` を実行し、指摘（**error / warning 両方**。eslint が何か出力したか＝非空で判定）を stdout へ（Claude が自己修正）。eslint 未導入・非対象拡張子・ファイル不存在なら即 `exit 0`。ブロックはしない（フィードバックのみ）。
- `.claude/hooks/notify.sh`：Notification 時にクロスプラットフォームで短い音（WSL: `powershell.exe [console]::beep`、macOS: `afplay`、Linux: `paplay`、fallback: 端末ベル `\a`）。バックグラウンド実行・音源無しでも無害。
- `.claude/settings.json`：`PostToolUse`（`Write|Edit` → lint-on-save）と `Notification`（→ notify.sh, async）を既存 `PreToolUse` にマージ。

## Todo

- [x] `.claude/hooks/lint-on-save.sh`
- [x] `.claude/hooks/notify.sh`
- [x] `.claude/settings.json` に PostToolUse・Notification をマージ
- [x] スクリプトの pipe テスト（JS/TS でエラー検出・非対象は素通り）
- [x] `docs/000_index`・`docs/harness/02_maturity`（G-5 反映）更新
- [x] `npm run verify` → `/push-review`
