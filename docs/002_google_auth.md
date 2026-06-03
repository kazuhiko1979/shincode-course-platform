# 002 Google OAuth 認証

## 概要
Google OAuth によるログイン・ログアウト・コールバック処理と、認証状態に応じたアクセス制御。

---

## Todo

### Supabase 設定
- [x] Supabase ダッシュボードで Google OAuth プロバイダーを有効にする
- [x] Google Cloud Console で OAuth クライアントを作成しリダイレクトURIを設定する

### ルート実装
- [x] `app/auth/login/page.tsx` — Google ログインボタンを表示するページ
- [x] `app/auth/callback/route.ts` — OAuth コールバックを処理する Route Handler
  - `code` パラメータを受け取り `exchangeCodeForSession` を呼ぶ
  - 成功時は `/` にリダイレクト
  - エラー時は `/auth/login?error=...` にリダイレクト

### ログアウト
- [x] `app/auth/logout/route.ts` または Server Action でログアウト処理を実装する
- [x] ログアウト後は `/` にリダイレクトする

### アクセス制御（Middleware）
- [x] `/mypage` 以下：未ログインなら `/auth/login` にリダイレクト
- [x] `/admin` 以下：`role != 'admin'` なら `/` にリダイレクト
- [x] `middleware.ts` の `matcher` に上記パスを設定する（`proxy.ts`）

### 共通UIコンポーネント
- [x] `components/AuthButton.tsx` — ログイン/ログアウトボタン（ヘッダーに表示）
- [x] ログイン状態によって表示を切り替える（Server Component。現状 `getUser()` を使用 ⚠️）
