# 017 公開前セキュリティ / 品質チェックリスト（分析と是正バックログ）

## 概要
[catnose 氏「Webサイト公開前のセキュリティチェックシート」](https://zenn.dev/catnose99/articles/547cbf57e5ad28)を本スタック（Next.js 16 + Supabase, Google OAuth のみ, 課金なし）向けに最新化し、現コードベースと突き合わせて分析した。チェックリスト本体は **CLAUDE.md の「公開前セキュリティ / 品質チェックリスト」** に常設。本チケットは ⚠️（未対応）項目の是正バックログ。

## 分析サマリ
- ✅ 対応済：サーバ側入力検証（Zod）/ XSS（React）/ 認可（RLS＋ガード）/ Cookie 属性（@supabase/ssr）/ 秘密情報の非コミット / 画像ホスト制限 / alt・aria / DB インデックス / レイアウトシフト対策
- — 対象外：機微操作の再認証（退会等なし）/ 課金 / アプリ独自メール（SPF/DKIM/DMARC は Supabase 側）/ 予約ユーザー名（ユーザー名なし）

## Todo（是正バックログ・優先度順）
- [ ] **HTTP セキュリティヘッダーを付与**（最優先）：`next.config.ts` の `headers()` で全ルートに
  - `Strict-Transport-Security` / `X-Content-Type-Options: nosniff` / `X-Frame-Options: DENY` / `Referrer-Policy: strict-origin-when-cross-origin` / `Permissions-Policy`
  - `X-XSS-Protection` は非推奨のため付与しない。CSP は Report-Only から段階導入
- [ ] **SECURITY DEFINER 関数の公開実行権限を是正**：`revoke execute ... from public`（`admin_*`/`is_admin`/`handle_new_user`）。advisor WARN×10 解消
- [ ] `/search`・エラーページに `robots: { index: false }`（noindex）を付与
- [ ] OGP / Twitter Card（`openGraph`/`twitter` の `images` 等）を設定
- [ ] `app/sitemap.ts` を作成（公開コースを列挙）
- [ ] 検索の PostgREST `.or()` のカンマ/括弧エスケープ（影響小・公開テーブル）
- [ ] 運用：Supabase バックアップ/PITR の確認、Supabase・Vercel アカウントの 2FA 有効化
- [ ] 公開前：`next build` のバンドル分析、静的アセットの CDN 配信確認

## メモ
- 「いま悪用可能なクリティカル」はなし（[セキュリティレビュー履歴参照]）。本チケットは公開前ハードニングの位置づけ。
