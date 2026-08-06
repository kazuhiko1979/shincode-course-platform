# 026 Codex CLI ハーネス成熟度 90点化

ステータス：✅ 完了

## 目的

Codex CLI 単体のハーネス成熟度を 86/100 から 90点以上へ引き上げる。Claude 固有資産への依存を減らし、Codex 専用 reviewer、再現可能な k=3 評価実績、秘密値を出さない環境診断を追加する。

## スコープ

- `.codex/agents/` に security / code / performance の読み取り専用 reviewer を定義する。
- `.codex/config.toml` で multi-agent を有効化し、並列上限を明示する。
- Codex の Hooks・symlink・MCP名・Node・通知・permissions・agent定義を診断する doctor を追加する。
- `evals/tasks.json` の user-request タスクを1件選び、独立 worktree で k=3 試行する。
- pass@3 / pass^3、各 trial の証拠、grader 結果を Git 管理の outcome に記録する。

## 対象外

- 評価trialの実装を製品コードへ採用・mergeしない。
- DB / RLS / Supabase リモート書き込みを行わない。
- reviewer に GitHub / Supabase / Notion の書き込み権限を与えない。
- Claude Code 固有 agent ファイルを削除・上書きしない。

## Todo

- [x] Codex reviewer 3ロールとmulti-agent設定を追加する
- [x] reviewer設定をstrict configと実セッション選択で検証する
- [x] 秘密値非表示のCodex doctorを追加し、全項目を検証する
- [x] user-requestタスクを独立worktreeでk=3実行する
- [x] pass@3 / pass^3 とtrial証拠を記録する
- [x] 3観点レビュー、grader、doctor、`npm run verify`を通し成熟度を再採点する

## 完了条件

- reviewer 3ロールがすべて `read-only` で、Critical → Low・`file:line`・ブロッカー有無の形式を要求する。
- doctor が秘密値を出力せず、必須項目を PASS / WARN / FAIL で返し、FAIL時は非0終了する。
- 同じ user-request prompt を3つの独立環境で実行し、同じgraderで採点する。
- outcome に trial、検証結果、pass@3 / pass^3、失敗理由が記録される。
- `npm run verify` が exit 0。

## 実測結果

- doctor：32 Pass / 1 Warn / 0 Fail（Warnは対話的 `/hooks` trust確認）
- U9 k=3：3/3 Pass、`pass@3 = 100%`、`pass^3 = 100%`。未実装であることを事前確認し、各trialのpatch・Evaluator report・verify結果を保存した。詳細は [`evals/outcomes/U9-admin-course-duplicate-2026-08-06.md`](../evals/outcomes/U9-admin-course-duplicate-2026-08-06.md)。
- 先に選んだU11が基準コミットで実装済みと判明したため採点対象から除外し、未実装U9へ切り替えた。一時worktree消失・依存symlink問題も、リポジトリ配下worktreeと依存実体配置で修正して再計測した。

## Codex CLI 単体スコア

各領域を10点満点で、Git管理された設定・実測証拠がある場合だけ加点した。

| 領域 | 点 | 根拠 |
|---|---:|---|
| 共通コンテキスト | 10 | `AGENTS.md` と `.agents/` を正典化 |
| 決定論的安全制御 | 9 | PreToolUse / PostToolUse / SessionStart / Notification |
| Codex reviewer | 10 | 3ロール、read-only、approval never、外部MCP無効 |
| 環境doctor | 9 | 32 Pass / 1 Warn / 0 Fail、秘密値非表示 |
| MCP・ツール境界 | 9 | reviewerでは8 MCPをfail-closed、通常sessionでは診断 |
| 検証ゲート | 10 | lint / typecheck / 11 tests / build |
| 評価ハーネス | 9 | 未実装U9 k=3、patch/report、pass@3 / pass^3を永続化 |
| デュアルCLI運用 | 9 | worktree・書き手分離・handoff正典 |
| 長時間セッション | 8 | progress / feature list / SessionStart。会話自体は非同期 |
| 操作性・保守性 | 8 | status / notify / doctor。対話的Hook trust確認が残る |
| **合計** | **91 / 100** | 90点目標を達成 |
