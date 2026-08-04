# 022 エージェント向けツール設計（ACI 最適化・領域8）

ステータス：✅ 完了

## 目的

教材 §8「エージェント向けツール設計」（`docs/harness/01_principles.md` §8）を本プロジェクトに適用し、**ツール面（agent-facing tools）の設計基準を永続化**する。対象：ツールの最適化／選択的実装（タスク指向 3〜5）／コンテキスト効率／命名戦略／エラー設計／3フェーズ改善。

## 監査結果（2026-08-03 実測）

- MCP 6サーバー（playwright/supabase/github/notion/serena/context7）≈ **100超ツール**。Claude Code の遅延ロード（ToolSearch）で常時コンテキストは抑制済み
- レビュアー3体は `tools: Read, Grep, Glob, Bash, Write` の **5ツール**（原則適合）／`serena-expert` は全継承
- npm scripts 7（正規ゲートは `verify` の1つ）／コマンド・スキル3（push-review・serena・material-design、タスク指向）
- **notion は本プロジェクトで使用実績なし**（削減候補）

## Todo

- [x] `docs/harness/06_tool-design.md` 作成（6原則の適用ルール＋監査台帳＋3フェーズ改善ループ＋運用チェックリスト）
- [x] 導線（`docs/harness/000_index.md`・`AGENTS.md` 設計の軸）
- [x] `02_maturity.md` 領域8=2.5・総合 24.5/30（82%）・`03_one-pager.md`・progress 同期
- [x] `000_index` 更新（228/237）・`npm run verify` 通過
