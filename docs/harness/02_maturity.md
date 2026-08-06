# 本プロジェクトのハーネス成熟度アセスメント

> 「[01_principles.md](./01_principles.md)」の枠組みで、本リポジトリの現状ハーネスを採点し、ギャップと導入候補を整理する。
> 採点日：2026-08-06（#026 反映時点）。設計哲学＝**「凹みに構造を、でっぱりは安心して任せる」**（凹み対策がどれだけ構造化されているかを見る）。

**凡例**：✅ 十分 / 🟡 部分的 / ⚠️ 不足 / ❌ 未着手 ・ スコアは 0–3。

## サマリ

| # | 領域 | 状態 | 根拠（本リポジトリの実物） |
|---|---|---|---|
| 1 | コンテキスト4戦略 W/S/C/I | ✅ 3 | Write=`AGENTS.md`/`docs/`/`.serena/memories`、Select=`.agents/rules/*`・Skills、Isolate=3 reviewers。Claude/Codex 共通正典は [08_dual-cli-playbook](./08_dual-cli-playbook.md) |
| 2 | 6制御IF（俯瞰） | ✅ 3 | AGENTS.md✅ Rules✅ Skills✅ Subagents✅ MCP✅ Hooks✅。`.agents/` を共通実体として Claude/Codex 双方へ配線 |
| 3 | Hooks（決定論的制御） | ✅ 3 | **Pre/Post/Notification/SessionStart すべて導入済み**：PreToolUse ガードレール（[docs/018](../018_pretooluse_guardrails.md)、危険操作を `exit 2` ブロック）＋ PostToolUse lint-on-save（[docs/019](../019_posttooluse_lint_and_notify.md)、編集後 eslint）＋ 共有 Notification 音（`notify.sh`）＋ SessionStart ハンドオフ注入（[docs/021](../021_long_session_handoff.md)）。実体は `.agents/hooks/`、Claude/Codex の両設定から参照 |
| 4 | 設計パターン（ルーティング/ACI/投票） | ✅ 2.5 | Rules＝ルーティング✅、投票＝3視点レビュー✅（教材p62の実装そのもの）。ACIは外部MCP依存でカスタム最適化は限定的 |
| 5 | Generator-Evaluator | 🟡 2.5 | reviewers が生成と分離した評価者として機能✅。**`specs/evaluation-rubric.md`（段階評価）と `specs/sprint-contract.md`（二値の完了基準・合意文書）を整備済み**。残りは実スプリントでの反復ループ運用実績 |
| 6 | マルチエージェント | ✅ 3 | ファンアウト・ギャザー＝3並列レビュー✅。Claudeに加え、Codex専用の読み取り専用 `security_reviewer` / `code_reviewer` / `performance_reviewer` を `.codex/agents/` に定義し、出力形式・禁止操作・ツール境界を固定。運用ルーティングは [05_multiagent-playbook](./05_multiagent-playbook.md) に形式化 |
| 7 | 長時間エージェント管理 | 🟡 2.5 | **構造化ハンドオフ導入済み**（[docs/021](../021_long_session_handoff.md)）：`claude-progress.txt`（引き継ぎノート）＋`feature_list.json`（passes のみ変更可の規約）＋**SessionStart フックで自動注入**（決定論化）。コンテキスト不安/肥大化/毒性の規律を CLAUDE.md に明文化。残りは実運用実績 |
| 8 | ツール設計（ACI/選択的実装） | 🟡 2.5 | **ACI 基準と監査台帳を形式化**（[06_tool-design.md](./06_tool-design.md)＝選択的実装3〜5・命名・エラー3点セット・3フェーズ改善・運用チェックリスト。reviewers は5ツール適合、notion 削減を勧告）。カスタム MCP は無し（必要になるまで作らない＝YAGNI） |
| 9 | 検証ループ | 🟡 2.5 | **ルールベースは強い**（`verify`＋CI＋lint-on-save）✅。**3戦略のルーティングと「検証の階段」を形式化**（[07_verification-loop.md](./07_verification-loop.md)＝まずルールベース・過剰検証の回避・シンプル→実測→精緻化。CLAUDE.md テスト方針に要約配線）。残りはビジュアル/rubric 採点の運用実績 |
| 10 | 評価ハーネス（Tasks/Graders/pass@k） | 🟡 2.5 | 20タスクとGraderに加え、基準コミットで未実装のuser-request U9を独立worktreeでk=3実運転し、固定grader、trial patch/report、`pass@3 = 100%` / `pass^3 = 100%`を[Git管理のoutcome](../../evals/outcomes/U9-admin-course-duplicate-2026-08-06.md)へ記録。残りは複数タスクへの拡張 |

**総合：27 / 30（90%）** — Codex専用の読み取り専用reviewer 3ロール、秘密値を出さないdoctor、user-request k=3の初回実運転を追加。初回の評価インフラ問題も記録し、永続worktreeへ修正後に3/3 Passを確定した。次の焦点は複数タスクへの評価拡張と、実スプリントでのGenerator-Evaluator反復実績。

---

## 強み（＝でっぱりを安心して任せられている部分）

- **Write戦略が厚い**：`CLAUDE.md`＋`AGENTS.md`＋`docs/`チケット＋`.serena/memories/` で知識が永続化され、セッションを超えて引き継げる。
- **Isolate＋投票が実装済み**：`code/security/performance-reviewer` の3並列＋`/push-review` は、教材の「ファンアウト・ギャザー」「投票パターン（2つ以上が指摘＝高確度）」の教科書的実装。
- **ルールベース検証ゲートが確立**：`npm run verify`（lint→typecheck→test→build）＋ CI（PR/main push）で、客観的エラーを確実に落とす仕組みがある。
- **安全ルールが明文化**：`AGENTS.md` の「エージェント作業の安全ルール」で変更禁止ゾーン・spec-first・最小差分・Git安全則を規定済み。

---

## ギャップと導入候補（優先度順ロードマップ）

> 各項目は**提案**。Hooks/settings 変更や新規ファイルは `AGENTS.md` の変更禁止ゾーン・spec-first に従い、**着手前に人間承認＋`docs/` 起票**する。

### P1（効果大・凹み対策の要）

- **✅ G-1（完了・[docs/018](../018_pretooluse_guardrails.md)）: PreToolUse フックで「変更禁止ゾーン」を決定論的にブロック**（領域3）
  `AGENTS.md` の文章＝確率的な「お願い」だった禁止事項を、`.claude/hooks/validate-*.sh` ＋ `.claude/settings.json` の `PreToolUse` で `exit 2` 強制ブロックに格上げ。
  対象：破滅的 `rm -rf`、`git push --force`、`git add -A`/`.`、`.env` ステージ、`sudo rm`、`reset --hard`、`clean -fdx`、`chmod 777`、`mkfs`、`dd`→device、fork bomb、`curl|sh`、Supabase MCP の書き込み（`apply_migration`/DDL・DML `execute_sql`、`CLAUDE_ALLOW_DB_WRITE=1` で承認オーバーライド）。pipe テスト 46/46 パス。

- **✅ G-2（完了・[docs/021](../021_long_session_handoff.md)）: 構造化ハンドオフの規約**（領域7）
  `claude-progress.txt`（完了/状態/次アクション・60行以内・検証済み事実のみ）＋`feature_list.json`（`passes` のみ変更可の規約。決定論的ガード化は候補）を導入し、**SessionStart フック**でセッション開始時に自動注入（手順の決定論化）。CLAUDE.md にスタートアップ手順・不安/肥大化/毒性の規律・Initializer/後継の役割分担を明文化。

### P2（品質の底上げ）

- **✅ G-3（形式化完了）: Generator-Evaluator の形式化**（領域5）
  ✅ `specs/evaluation-rubric.md`（UI 品質基準＝段階評価）と ✅ `specs/sprint-contract.md`（完了基準＝二値の合意文書。ユーザ認証機能を正典例＝回帰チェックリストとして記載）を整備。いずれも CLAUDE.md のテスト方針・ディレクトリ構成から参照。
  残り：実スプリントでの運用実績（契約の事前合意 → Evaluator の全項目 Pass 確認 → rubric 反復採点）。

- **🟡 G-4（ルーティング形式化済み・運用実績待ち）: ビジュアル検証**（領域9）
  発動条件は [07_verification-loop.md](./07_verification-loop.md) §2 に形式化（UI 新規/リデザイン時に Playwright スクショ＋rubric 採点。小修正には課さない＝過剰検証の回避）。残りは実際の UI 変更での運用実績。

- **✅ G-5（完了・[docs/019](../019_posttooluse_lint_and_notify.md)）: PostToolUse フックで編集後 lint 自動化**（領域3/9）
  `Write|Edit` 後に JS/TS のみ eslint を実行し、指摘を stdout で Claude に返す（fast-fail）。あわせて共有 Notification 音（`notify.sh`）も導入。

### P3（計測して改善し続ける）

- **🟡 G-6（種まき完了・[docs/024](../024_eval_harness.md)）: プロジェクト評価ハーネス**（領域10）
  `evals/`（README＋tasks.json）に20タスク＋Grader＋pass@k プロトコルを整備。regression 6 は実測ベースライン付き（Regression Eval の基準点）。残りは model/human タスクの初回実行と、ハーネス変更前後の pass@k 比較の運用実績。

---

## 次にやるなら
G-1/G-2/G-3/G-5 は **✅ 完了**（docs/018・019・021・specs/）。G-6 も**種まき完了**（evals/）。残りは **G-4（ビジュアル検証）** と各形式化の**運用実績づくり**（次の機能開発で contract→検収パイプラインを実践）。着手時は `docs/` に起票し、settings 変更は人間承認のうえ行う。
