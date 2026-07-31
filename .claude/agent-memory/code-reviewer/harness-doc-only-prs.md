---
name: harness-doc-only-prs
description: このリポジトリは「ハーネス設計の学習資産」でもあり、ランタイム無変更のドキュメント/ハーネス PR が多い。その場合のレビュー主軸
metadata:
  type: project
---

このリポジトリの PR は、アプリ機能ではなく**ハーネス部品（rules / hooks / specs / reviewers / テスト土台）と
それを説明するドキュメント**の追加であることが少なくない（`lib/`・`app/` が無変更の diff）。
その種の PR で load-bearing なレビュー軸は次の 2 つ。

1. **エージェント向け文書の横断整合**：`CLAUDE.md` / `AGENTS.md` / `.github/workflows/ci.yml` のコメント /
   `.claude/agents/*` / `docs/harness/02_maturity.md` は同じ事実を別々に述べている。片方だけ更新すると、
   別セッションのサブエージェントが古い記述を信じて誤った運用をする（例：「テストランナー未設定」を読んで `npm test` を回さない）。
2. **新しい散文ルールに強制点があるか**：このプロジェクトは「文章のお願い → Hook / CI で決定論的に強制」へ格上げする
   方針を明示している（docs/018・019 の実績）。新ルール追加 PR では「誰がいつ検証するのか（verify / CI / hook）」を必ず確認する。

**Why:** 目的が「モデルが進化しても残るハーネス構造の蓄積」なので、矛盾した agent-facing 文書と
強制点のないルールは、コードのバグと同程度に実害がある（次セッションの挙動が変わる）。
**How to apply:** ランタイム無変更の diff を見たら、変更された主張を repo 全体に grep して
古い記述の残骸を洗い出す。新ルールには `npm run verify` / CI / PreToolUse のどこで担保されるかを問う。
関連: [[common-mistakes]]・[[project-architecture]]
