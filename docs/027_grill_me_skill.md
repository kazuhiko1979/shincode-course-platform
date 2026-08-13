# 027 プロジェクト共通 grill-me Skill

ステータス：✅ 完了

## 目的

Claude Code と Codex CLI の双方で、実装前に要件の曖昧さ・抜け漏れ・リスク・受け入れ条件を質問形式で洗い出す `grill-me` Skill を共有する。

## スコープ

- `.agents/skills/grill-me/SKILL.md` を共通の正典として追加する。
- `.claude/skills/grill-me` を正典への互換リンクとして追加する。
- Skill のフロントマターと内容を検証する。
- 実装開始前の質問フェーズ、回答後の合意サマリー、実装開始条件を定義する。

## 対象外

- 自動的な仕様決定や、ユーザーの回答なしの実装開始。
- 既存の `AGENTS.md`、Rules、Hooks、Reviewer の置き換え。
- プロジェクト外のグローバル Skill の変更。

## Todo

- [x] grill-me の質問フローと停止条件を定義する
- [x] `.agents/skills/grill-me/SKILL.md` を追加する
- [x] `.claude/skills/grill-me` の互換リンクを追加する
- [x] Skill 検証と利用方法を確認する

## 完了条件

- 要件が不明確な場合、1回に1問ずつ質問し、回答前に実装を開始しない。
- 回答後に目的・スコープ・制約・受け入れ条件・未解決事項を要約する。
- Codex と Claude Code が同じ本文を参照する。
- Skill の形式検証が成功する。

## 実測結果

- `quick_validate.py .agents/skills/grill-me` が `Skill is valid!` で終了した。
- Claude互換リンクは `.claude/skills/grill-me -> ../../.agents/skills/grill-me` として作成した。
