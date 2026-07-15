---
name: rules-split
description: 詳細規約が CLAUDE.md から .claude/rules/ 配下へ分割され、CLAUDE.md 冒頭の @import で常時ロードされる
metadata:
  type: project
---

2026-07-15 の作業ツリー変更で、Next.js 16 破壊的変更・App Router ベストプラクティス・Supabase SSR ルール・公開前セキュリティ/品質チェックリストが `CLAUDE.md` から `.claude/rules/frontend/patterns.md`・`.claude/rules/backend/patterns.md` へ移動された。各ファイル先頭に `paths:` frontmatter（対象グロブ）が付く。CLAUDE.md には Stack・ディレクトリ構成・命名/TS 規約・ワークフローが残る。

**Why:** ファイル別スコープで規約を出し分ける意図。当初は自動ロード機構が不明だったが、`CLAUDE.md` 冒頭に `@.claude/rules/backend/patterns.md`・`@.claude/rules/frontend/patterns.md` の @import が追加され、両ファイルは常時コンテキストに読み込まれるようになった（`paths:` frontmatter は付いたままだが @import では全文ロードされるため装飾的）。これで規約が文脈から漏れる懸念は解消。ユーザーは開発ツールを Codex へ移行検討中。

**How to apply:** 規約準拠をレビューする際、正典は CLAUDE.md だけでなく `.claude/rules/**/patterns.md` も参照する。@import で読み込まれる前提。
