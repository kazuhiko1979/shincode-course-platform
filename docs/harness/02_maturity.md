# 本プロジェクトのハーネス成熟度アセスメント

> 「[01_principles.md](./01_principles.md)」の枠組みで、本リポジトリの現状ハーネスを採点し、ギャップと導入候補を整理する。
> 採点日：2026-07-29（コミット `1dfc1bf` 時点）。設計哲学＝**「凹みに構造を、でっぱりは安心して任せる」**（凹み対策がどれだけ構造化されているかを見る）。

**凡例**：✅ 十分 / 🟡 部分的 / ⚠️ 不足 / ❌ 未着手 ・ スコアは 0–3。

## サマリ

| # | 領域 | 状態 | 根拠（本リポジトリの実物） |
|---|---|---|---|
| 1 | コンテキスト4戦略 W/S/C/I | ✅ 3 | Write=`CLAUDE.md`/`AGENTS.md`/`docs/`/`.serena/memories`、Select=`.claude/rules/*`・Skills、Isolate=3 reviewers |
| 2 | 6制御IF（俯瞰） | 🟡 2 | CLAUDE.md✅ Rules✅ Skills✅ Subagents✅ MCP✅ だが **Hooks が弱い** |
| 3 | Hooks（決定論的制御） | 🟡 2.5 | **PreToolUse ガードレール導入済み**（`.claude/hooks/validate-*.sh`＋`.claude/settings.json`、[docs/018](../018_pretooluse_guardrails.md)）＝破滅的 rm・force push・git add -A/.・.env ステージ・Supabase 書き込みを `exit 2` で強制ブロック。完了音は Stop hook。PostToolUse（編集後 lint 自動化）は未導入 |
| 4 | 設計パターン（ルーティング/ACI/投票） | ✅ 2.5 | Rules＝ルーティング✅、投票＝3視点レビュー✅（教材p62の実装そのもの）。ACIは外部MCP依存でカスタム最適化は限定的 |
| 5 | Generator-Evaluator | 🟡 1.5 | reviewers が生成と分離した評価者として機能✅。但し `sprint-contract.md`/`evaluation-rubric.md` 無し、反復ループも非形式化 |
| 6 | マルチエージェント | 🟡 2 | ファンアウト・ギャザー＝`/push-review`の3並列✅。オーケストレーター/パイプラインは非形式化 |
| 7 | 長時間エージェント管理 | 🟡 1.5 | 進捗ファイル＝`docs/`チケット運用✅（更新ルール厳格）。**構造化ハンドオフ文書の規約なし**、`feature_list`型のテストロックなし |
| 8 | ツール設計（ACI/選択的実装） | 🟡 2 | MCPは外部（supabase/github/playwright）中心でカスタムACIは無し。CLAUDE.mdのコマンド記述は改善済✅ |
| 9 | 検証ループ | 🟡 2 | **ルールベースは強い**（`npm run verify`＋CI＋reviewers）✅。ビジュアル検証は散発的、LLM-judgeはreviewersで近似 |
| 10 | 評価ハーネス（Tasks/Graders/pass@k） | ⚠️ 0.5 | プロジェクト横断のeval無し。`.claude/skills/material-design/evals/evals.json` に芽のみ |

**総合：19.5 / 30（65%）** — Write戦略・Isolate・ルールベース検証は成熟。**PreToolUse 決定論的ガードレール（G-1）を導入済み**。残る弱点は「生成と評価の形式化」「構造化ハンドオフ」「評価ハーネス」「PostToolUse 自動 lint」。いずれも AI の「凹み（苦手）」に構造を与える部分で、ここを補強すると資産価値が伸びる。

---

## 強み（＝でっぱりを安心して任せられている部分）

- **Write戦略が厚い**：`CLAUDE.md`＋`AGENTS.md`＋`docs/`チケット＋`.serena/memories/` で知識が永続化され、セッションを超えて引き継げる。
- **Isolate＋投票が実装済み**：`code/security/performance-reviewer` の3並列＋`/push-review` は、教材の「ファンアウト・ギャザー」「投票パターン（2つ以上が指摘＝高確度）」の教科書的実装。
- **ルールベース検証ゲートが確立**：`npm run verify`（lint→typecheck→build）＋ CI（PR/main push）で、客観的エラーを確実に落とす仕組みがある。
- **安全ルールが明文化**：`AGENTS.md` の「エージェント作業の安全ルール」で変更禁止ゾーン・spec-first・最小差分・Git安全則を規定済み。

---

## ギャップと導入候補（優先度順ロードマップ）

> 各項目は**提案**。Hooks/settings 変更や新規ファイルは `AGENTS.md` の変更禁止ゾーン・spec-first に従い、**着手前に人間承認＋`docs/` 起票**する。

### P1（効果大・凹み対策の要）

- **✅ G-1（完了・[docs/018](../018_pretooluse_guardrails.md)）: PreToolUse フックで「変更禁止ゾーン」を決定論的にブロック**（領域3）
  `AGENTS.md` の文章＝確率的な「お願い」だった禁止事項を、`.claude/hooks/validate-*.sh` ＋ `.claude/settings.json` の `PreToolUse` で `exit 2` 強制ブロックに格上げ。
  対象：破滅的 `rm -rf`、`git push --force`、`git add -A`/`.`、`.env` ステージ、`sudo rm`、`reset --hard`、`clean -fdx`、`chmod 777`、`mkfs`、`dd`→device、fork bomb、`curl|sh`、Supabase MCP の書き込み（`apply_migration`/DDL・DML `execute_sql`、`CLAUDE_ALLOW_DB_WRITE=1` で承認オーバーライド）。pipe テスト 46/46 パス。

- **G-2: 構造化ハンドオフの規約**（領域7）
  「コンテキスト不安」による早期打ち切り対策。長時間セッションの引き継ぎテンプレ（完了/未完了/重要判断/次アクション）を `docs/harness/handoff-template.md` として用意し、CLAUDE.md にセッション開始手順を追記。

### P2（品質の底上げ）

- **G-3: Generator-Evaluator の形式化**（領域5）
  機能開発時に `specs/sprint-contract.md`（完了基準＝二値）と `specs/evaluation-rubric.md`（品質＝段階）を作り、reviewers を Evaluator として回す。過度な仕様書は不要、検証可能な完了条件に集中。

- **G-4: ビジュアル検証を verify に統合**（領域9）
  UI 変更時に Playwright MCP でスクリーンショット→マルチモーダル評価を回す。既存の `webapp-testing`/`material-design` の資産を流用。

- **G-5: PostToolUse フックで編集後 lint 自動化**（領域3）
  ファイル編集直後に対象ファイルだけ lint（`async: true`）。verify を待たず早期フィードバック。

### P3（計測して改善し続ける）

- **G-6: プロジェクト評価ハーネスの種まき**（領域10）
  `material-design/evals/evals.json` を出発点に、20タスク（最近のバグ・よくある要求・エッジケース・難題）＋Grader を用意。ハーネス変更を `pass@k`/`pass^k` で採否判断できるようにする。Regression Eval で退行を防ぐ。

---

## 次にやるなら
G-1（PreToolUse ガードレール）は **✅ 完了（docs/018）**。次点は **G-5（PostToolUse フックで編集後 lint 自動化）** か **G-2（構造化ハンドオフ）**。着手時は `docs/` に起票し、settings 変更は `update-config` スキルで人間承認のうえ行う。
