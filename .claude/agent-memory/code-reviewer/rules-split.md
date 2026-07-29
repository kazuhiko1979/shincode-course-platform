---
name: rules-split
description: 詳細規約は .claude/rules/ 配下に分割。読み込み機構が @import から paths: フロントマター（path-specific rules）へ変更された
metadata:
  type: project
---

2026-07-15 に Next.js 16 破壊的変更・App Router ベストプラクティス・Supabase SSR ルール・公開前セキュリティ/品質チェックリストが `CLAUDE.md` から `.claude/rules/frontend/patterns.md`・`.claude/rules/backend/patterns.md` へ移動された。CLAUDE.md には Stack・ディレクトリ構成・命名/TS 規約・ワークフローが残る。各ファイル先頭に `paths:` frontmatter がある：
- backend: `lib/**/*.ts` / `app/**/actions.ts` / `proxy.ts`
- frontend: `app/**/*.tsx` / `app/**/*.ts` / `components/**/*.tsx`

2026-07-29（ブランチ docs/claude-config-consistency）で、CLAUDE.md 冒頭の `@.claude/rules/backend/patterns.md`・`@.claude/rules/frontend/patterns.md` の **@import 2行が削除**され、`paths:` による path-specific rules（Select 戦略・該当ファイル操作時のみ自動ロード）に一本化された。同時に backend glob へ `app/**/route.ts`（callback/logout の GET 副作用）と `next.config.ts`（セキュリティヘッダー規約）を追加。現在の backend glob: `lib/**/*.ts` / `app/**/actions.ts` / `app/**/route.ts` / `proxy.ts` / `next.config.ts`。

**検証済み（2026-07-29 再レビュー）:** path-specific rules（`paths:` frontmatter）は Claude Code ネイティブ機能（公式 memory.md#path-specific-rules、v2.1.198 以降で安定）。本環境の実行バージョンは `claude --version` = 2.1.220（≥2.1.198）で要件充足。よって @import 削除による規約欠落の回帰リスクは解消と判断。実ファイル対応も確認済み：`app/auth/callback/route.ts`・`app/auth/logout/route.ts`→route.ts glob、全 `app/**/actions.ts`（`(protected)` route group 含む）、`lib/**`（auth.ts/schemas.ts/supabase/*）、proxy.ts、next.config.ts が全て backend glob にカバーされ、セキュリティ規約の穴なし。

**Why:** @import は常時全文ロードで二重ロード・コンテキスト浪費になるため、ファイル別スコープで出し分ける意図。

**残る留意点（note レベル）:** (1) `paths:` は「該当ファイルを操作した時のみ」ロードされる Select 戦略なので、ファイル操作を伴わない純粋な計画・議論フェーズでは規約が文脈に入らない（コーディング時は編集で発火するので実害小）。(2) auto-load の runtime 動作自体はレビューでは直接テストできず、バージョン要件充足＋公式ドキュメント確認で担保している。

**How to apply:** 規約準拠レビューでは CLAUDE.md だけでなく `.claude/rules/**/patterns.md` も正典として参照する。編集対象ファイルが glob にマッチするかで該当規約が文脈に入るかを判断する。
