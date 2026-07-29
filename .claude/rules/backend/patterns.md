---
paths:
  - "lib/**/*.ts"
  - "app/**/actions.ts"
  - "app/**/route.ts"
  - "proxy.ts"
  - "next.config.ts"
---

## Supabase SSR クライアント

### 環境変数

`.env.local` に設定：`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **新しいキー形式を使う** — `sb_publishable_xxx` / `sb_secret_xxx`。レガシーの `anon` キーは使わない

### 2種類のクライアント

| クライアント | 用途 |
|---|---|
| Browser client | `'use client'` コンポーネント（ブラウザ実行） |
| Server client | Server Components・Server Actions・Route Handlers |

Server Components はCookieの書き込みができないため、期限切れトークンのリフレッシュとCookie保存に **Proxyパターン** が必要。

Proxyパターンの3つの責務：
1. `supabase.auth.getClaims()` でトークンをリフレッシュする
2. リフレッシュ済みトークンを `request.cookies.set` でServer Componentsに渡す
3. 更新済みトークンを `response.cookies.set` でブラウザに送り返す

### 認証検証のルール（重要）

**サーバーコードでは必ず `supabase.auth.getClaims()` を使う — `supabase.auth.getSession()` は使わない。**

- `getClaims()` — 呼び出しのたびに公開鍵でJWT署名を検証する（安全）
- `getSession()` — トークン再検証を保証しない（サーバーサイドでは信頼できない）

サーバー側ではリクエストごとにCookieが変わるため、**リクエストのたびにクライアントを再生成する**。

### CDNキャッシュの注意

ISRやCDNを使う場合、`Set-Cookie` ヘッダーを含むレスポンスがキャッシュされると、あるユーザーのセッションが別ユーザーに漏洩する恐れがある。Supabaseクライアントから返される `Cache-Control` / `Expires` / `Pragma` ヘッダーをHTTPレスポンスに必ず適用すること。

---

## Server Action の戻り値パターン

戻り値は必ず `{ error?: string }` 形式にする。throw しない（`useActionState` で扱えなくなる）。

Server Action の実装順序：
1. 権限チェック（`isCurrentUserAdmin()`）
2. Zod バリデーション（`schema.safeParse()`）
3. DB 操作
4. キャッシュ更新（`revalidatePath` / `updateTag`）
5. `return {}`

## エラーハンドリング

- **lib 関数（データ取得）**：`throw new Error('日本語メッセージ: ' + error.message)` で伝播
- **Server Actions**：`return { error: '日本語メッセージ' }` で返す（throw しない）
- エラーメッセージはユーザー向けの日本語で書く

---

## 公開前セキュリティ / 品質チェックリスト

`✅=対応済 / ⚠️=未対応 / —=対象外`。**機能追加時はこの表で回帰チェックすること。**

### セキュリティ
| 項目 | 状態 | メモ |
|---|---|---|
| サーバ側入力バリデーション | ✅ | Zod（`lib/schemas.ts`）を全 Server Action に適用 |
| XSS（出力エスケープ・`dangerouslySetInnerHTML` 不使用） | ✅ | React 自動エスケープ。`javascript:` 等は `safeRedirectPath` で排除 |
| SQL/クエリインジェクション | ⚠️ | Supabase は基本パラメータ化。検索の `.or()` 文字列のみカンマ/括弧エスケープ未対応（公開テーブルのため影響小） |
| 認可（更新・削除前の権限確認 / WHERE 句） | ⚠️ | 現状は DB の RLS / RPC 権限が真の境界。`app/admin/.../actions.ts` 側では管理者再確認をほぼしていないため、公開前に実 DB の policy / grant / function 権限を再確認する |
| Cookie 属性（`HttpOnly` / `Secure` / `SameSite`） | ✅ | `@supabase/ssr` の認証 Cookie に依存。独自に機微情報を非 HttpOnly Cookie や `localStorage` に保存しない。独自 Cookie を追加する場合は `__Host-` か `__Secure-` 接頭辞を優先 |
| CSRF / クロスサイト POST 対策 | ⚠️ | state-changing endpoint で `GET` を使わないことに加え、`Origin` / `Sec-Fetch-Site` 検証、またはフレームワーク組み込み保護の確認を行う。特に logout・role変更・作成/更新/削除系は公開前に実機確認 |
| **HTTP セキュリティヘッダー** | ✅ | `next.config.ts` の `headers()` で全ルートに付与済み（HSTS・X-Content-Type-Options・CSP frame-ancestors・X-Frame-Options・Referrer-Policy・Permissions-Policy） |
| 機微操作の再認証（退会・メール変更など） | — | 現状は role 変更のみ（admin 操作）。退会/メール変更機能なし |
| 秘密情報の非コミット | ✅ | `.env*` は gitignore。リポジトリは publishable key のみ（service_role 無し） |
| SECURITY DEFINER 関数の公開実行権限 | ⚠️ | repo 内に migration SQL が無く、`admin_*`/`is_admin`/`handle_new_user` に `REVOKE EXECUTE ... FROM PUBLIC` 済みかをコードだけでは保証できない。公開前に実 DB で確認 |
| 画像最適化のホスト制限 | ✅ | `remotePatterns` を使用ホストに限定（`'**'` 不使用） |
| レート制限 / リソース制限 | ⚠️ | 入力長制限はあるが、未ログインで叩ける検索・ログイン導線・将来のアップロード/問い合わせ系に頻度制限の記述なし。公開前に IP / user 単位の制限、ページング上限、コストアラートを確認 |
| バックアップ / クラウドアカウント 2FA | ⚠️ | 運用項目：Supabase の PITR/バックアップ確認、Supabase・Vercel アカウントの 2FA 有効化 |

### 推奨セキュリティヘッダー（最新）
`next.config.ts` の `async headers()` で全ルートに付与する。**`X-XSS-Protection` は非推奨なので追加しない。**
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`（`preload` は全サブドメインで HTTPS を強制できる場合のみ）
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy: frame-ancestors 'none'` を基本にし、必要なら `script-src` などは `Report-Only` から段階導入する
- `X-Frame-Options: DENY` は旧ブラウザ向けの後方互換としてのみ追加
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`（不要 API を無効化）
- CSP は最も強力だが Next の nonce / 外部リソース整理が必要。まず `Report-Only` で破壊範囲を確認してから本適用する

### SEO / OGP
| 項目 | 状態 | メモ |
|---|---|---|
| `<title>` / 説明 / 動的 metadata | ✅ | 各ページで `metadata` / `generateMetadata` |
| 検索・エラーページの `noindex` | ⚠️ | `/search` や結果ページは `robots: { index: false }` を付与すべき |
| OGP / Twitter Card（`og:image` 等） | ⚠️ | 現状 title/description のみ。`openGraph`/`twitter` 画像未設定 |
| XML サイトマップ | ⚠️ | `app/sitemap.ts` 未作成 |

### アクセシビリティ / パフォーマンス
| 項目 | 状態 | メモ |
|---|---|---|
| 画像 alt / アイコンボタンの `aria-label` | ✅ | `CourseCard`・検索/クリアボタン等で付与済 |
| レイアウトシフト防止（aspect-ratio / width/height） | ✅ | `next/image` の `fill`＋`aspect-video` |
| DB インデックス | ✅ | `videos(course_id, "order")` 追加済（FK 検索） |
| バンドルサイズ / 静的アセット CDN | ⚠️ | 公開前に `next build` のバンドル分析・配信 CDN を確認 |
