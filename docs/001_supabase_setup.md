# 001 Supabase セットアップ・DBスキーマ

## 概要
Supabase プロジェクトの初期設定、DBスキーマ作成、SSRクライアントのセットアップ。

---

## Todo

### 環境設定
- [x] `@supabase/supabase-js` `@supabase/ssr` をインストールする
- [x] `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を設定する
- [x] `.env.local` を `.gitignore` に追加する

### DBスキーマ作成（Supabase SQL Editor）
- [x] `users` テーブル — `auth.users` 拡張、`role: 'user' | 'admin'`
- [x] `courses` テーブル — `id`, `title`, `description`, `thumbnail_url`, `order`, `created_at`
- [x] `videos` テーブル — `id`, `course_id`(FK), `title`, `description`, `youtube_url`, `order`, `created_at`
- [x] `enrollments` テーブル — `user_id`(FK), `course_id`(FK), `created_at`（複合ユニーク）
- [x] `video_progress` テーブル — `user_id`(FK), `video_id`(FK), `completed_at`（複合ユニーク）
- [x] RLS (Row Level Security) を各テーブルに設定する

### Supabase クライアント実装
- [x] `lib/supabase/client.ts` — `createBrowserClient` を使ったブラウザ用クライアント
- [x] `lib/supabase/server.ts` — `createServerClient` を使ったサーバー用クライアント（cookies経由）
- [x] `lib/supabase/middleware.ts` — トークンリフレッシュ用 Proxy クライアント
- [ ] サーバーサイドでは `getSession()` を使わず必ず `getClaims()` を使う ⚠️ 現状 `getUser()` を使用（要確認）

### Middleware
- [x] `middleware.ts`（プロジェクトルート）を作成してトークンリフレッシュを実装する（Next.js 16 では `proxy.ts`）
- [x] `matcher` で `/mypage` と `/admin` のルートを保護する
