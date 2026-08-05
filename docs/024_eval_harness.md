# 024 評価ハーネスの種まき（20タスク＋ベースライン・G-6）

ステータス：✅ 完了

## 目的

教材 §10「評価ハーネス設計」（`docs/harness/01_principles.md` §10）の実装。**エージェントハーネス（実行）と分離した評価ハーネス（計測）**を作り、「評価インフラへの投資は複利のリターン」を成立させる：

- **20タスク**を本リポジトリの実履歴から選定（回帰6＝実際に起きた/指摘されたバグ・規約違反クラス／ユーザー要求6＝典型機能追加／エッジケース6／難題2＝Capability）
- **Grader**（Code-based / Model-based / Human）と**二値の合格基準**を各タスクに定義
- **将来のベースライン**：Code-graded タスクを今すぐ実測し、日付・証拠つきで記録（Regression Eval の基準点）
- 運用：ハーネス変更の採否を pass@k / pass^k で判断・タスクは実バグから追記（削除・書き換えは人間承認＝feature_list と同じ規約）

## Todo

- [x] `evals/README.md`（5構成要素・運用プロトコル・pass@k/pass^k・複利ループ）
- [x] `evals/tasks.json`（20タスク＝回帰6・要求6・エッジ6・難題2）
- [x] Code-graded 9件を整備し、8件を少なくとも部分実測（pass 7 / partial 1 / not_run 1。Step7 Grader検証で偽陽性を発見→R3/R5/E16 grader 精緻化＋lib/ の旧APIコメント3件を修正）
- [x] 導線（harness 索引・AGENTS.md）・`02_maturity.md` 領域10=1.5・総合85%・progress・`000_index` 同期
- [x] `npm run verify` 通過
