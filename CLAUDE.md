@AGENTS.md

## 進捗管理（重要・必須）

タスクは `docs/` 配下のチケット（`000_index.md` が一覧）で管理している。**作業のたびに必ず以下を守ること：**

- Todo を完了したら、そのチケット内の該当行を `- [ ]` → `- [x]` に**即座に**更新する（完了の都度。まとめて後回しにしない）
- チケットの完了数が変わったら `docs/000_index.md` の「完了/全体」欄と「総進捗」を更新する
- チケット着手時はステータスを `🔄 進行中`、全Todo完了時は `✅ 完了` に変更する
- 仕様と差異がある実装（例：指示と異なるAPI使用）はチェックを入れず、該当行に `⚠️` で理由を併記する

## プロジェクト概要

YouTubeにアップロードした動画をUdemyライクな講座プラットフォームとして公開するMVP。課金機能は後フェーズで追加。

### ユーザー種別

| 種別 | 認証 | 説明 |
|------|------|------|
| ゲスト | 不要 | URLを知っていれば誰でもコース・動画を閲覧可能 |
| ログオンユーザー | Google OAuth | 受講登録・進捗管理・マイページを利用可能 |
| 管理者 | Google OAuth | コース・動画の管理を行う（自分1人のみ） |

### ルート構成

```
/                          # コース一覧（トップページ）
/search                    # コース検索結果（?q=検索語, ?sort=relevance|newest）。ヘッダーのオートサジェスト検索バーから遷移
/courses/[id]              # コース詳細（動画一覧）
/courses/[id]/videos/[videoId]  # 動画視聴ページ（※Next.jsの重複スラッグ制約のため [videoId]）
/auth/login                # 統一ログイン（一般・管理者共通の Google ログイン。?next= 優先、無ければロール別の既定へ）
/auth/callback             # Google OAuth コールバック（next 検証→ロール別 admin:/admin user:/mypage）

/mypage                    # マイページ（要認証。未認証は /auth/login へ）
/mypage/courses            # 受講中コース一覧
/mypage/courses/[id]       # 受講コースの進捗詳細

/admin                     # 管理ダッシュボード（要管理者権限。未認証は /auth/login?next=… へ。統計サマリ＋各機能への導線）
/admin/users               # ユーザー管理（一覧・role を user ⇔ admin に変更）
/admin/stats               # 統計・分析（ユーザー/コース/受講登録などの集計）
/admin/courses             # コース一覧・管理
/admin/courses/new         # コース新規作成
/admin/courses/[id]/edit   # コース編集
/admin/courses/[id]/videos             # 動画一覧・管理
/admin/courses/[id]/videos/new         # 動画新規追加
/admin/courses/[id]/videos/[videoId]/edit # 動画編集
```

> **管理画面のルート構造**：`/admin` 配下の保護ページは `app/admin/(protected)/` 配下に置き、
> `app/admin/(protected)/layout.tsx` で `getClaims()` + 管理者判定のガードを行う（ルートグループのためURLは `/admin/...` のまま）。
> ログインは `/auth/login` に統一（専用の管理者ログイン画面は廃止）。middleware（`proxy.ts` / `lib/supabase/middleware.ts`）は
> 未認証の `/admin/*`・`/mypage/*` を `/auth/login?next=<元のパス>` へ振り分け、管理者以外が `/admin/*` に来た場合は `/mypage` へ逃がす。

> **管理者判定**：`public.users.role = 'admin'` のユーザーのみ管理者。判定は `lib/auth.ts` の `isAdminById(supabase, userId)` に集約し、middleware・layout・遷移ロジックが同じ関数を参照する（`getClaims().sub` でユーザーを特定 → role を照会）。
> 全ユーザーはサインアップ時にトリガー `handle_new_user()` で `role='user'` として作られる。admin への昇格は Supabase 上で `users.role` を手動変更（user ⇔ admin）して行う。RLS は本人参照のみ（`auth.uid() = id`）なので、各クライアントは自分の role だけ照会できる。

### DBスキーマ（Supabase）

- **users** — `auth.users` の拡張テーブル。`role: 'user' | 'admin'`
- **courses** — タイトル・説明・サムネイルURL・表示順
- **videos** — `course_id` FK、タイトル・説明・youtube_url・表示順
- **enrollments** — `user_id` + `course_id` の受講登録
- **video_progress** — `user_id` + `video_id` の視聴済みフラグ

> **管理機能の DB アクセス（重要）**：`users`・`enrollments`・`video_progress` は本人参照のみの RLS で、`auth.users` の email は PostgREST から直接読めない。管理画面のユーザー管理・統計は RLS を緩めず **`SECURITY DEFINER` 関数**経由で admin だけが横断アクセスする。
> - `is_admin()` … 呼び出し元が admin か（RLS 再帰回避のため SECURITY DEFINER）
> - `admin_list_users()` … 全ユーザー（email 含む）＋受講数
> - `admin_set_role(target_id, new_role)` … role 変更（値検証＋最後の admin 降格を防止）
> - `admin_stats()` … 集計値のみを JSON で返す（個票 RLS は緩めない）
> いずれも内部で `is_admin()` を確認し、`authenticated` のみ実行可（`anon` には付与しない）。クライアントからは `supabase.rpc(...)` で呼ぶ。

### アクセス制御

- `/mypage` 以下：ログイン必須
- `/admin` 以下：`role = 'admin'` のみ
- それ以外：ゲストも閲覧可能

### MVPスコープ外

課金・決済、コメント・Q&A、クイズ、複数講師対応は対象外。

---

## Commands

```bash
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run start    # start production server
npm run lint     # run ESLint
```

No test runner is configured.

## Stack

- **Next.js 16.2.6** (App Router) — 旧バージョンから破壊的変更あり（詳細は AGENTS.md）
- **React 19.2.4**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **TypeScript** (strict mode, path alias `@/*` → project root)
- **Zod v4** — 入力バリデーション（`lib/schemas.ts`）

## ディレクトリ構成

- `app/` — App Router のルート（`page.tsx`/`layout.tsx`/`route.ts`/`loading.tsx`/`error.tsx`/`not-found.tsx`）。ルートに直接関係するファイルのみ置く
- `components/` — 共有 UI（`Header`/`AuthButton`/`SearchBar`/`UserMenu`/`CourseCard` ほか、管理画面用は `components/admin/`）
- `lib/` — データ取得・ユーティリティ（`supabase/`（server/client/public/middleware）、`auth.ts`、`courses.ts`/`videos.ts`/`enrollments.ts`/`video_progress.ts`、`admin.ts`、`schemas.ts`、`youtube.ts`）
- `types/` — 型定義
- `proxy.ts` — ルートの middleware（Next 16 で `middleware.ts` から改称）
- `docs/` — 進捗チケット（`000_index.md` が一覧）

新しいルートは App Router 規約で `app/` 配下に追加する（`page.tsx`=ルート公開、`layout.tsx`=共有 UI、`route.ts`=外部 webhook / コールバック専用）。

## Next.js 16 Breaking Changes to Know

**`params` and `searchParams` are now Promises** — always `await` them:
```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

**Caching uses `use cache` directive**, not the old `fetch` cache options. Enable with `cacheComponents: true`（本プロジェクトは有効）:
```tsx
async function getCourses() {
  'use cache'
  cacheLife('days')
  cacheTag('courses')
  // cookies を使わない公開クライアント（lib/supabase/public.ts）で取得
}
```

> **本プロジェクトのキャッシュ方針（実装済み）**：`cacheComponents: true` 有効。
> - 公開データ取得（`lib/courses.ts`・`lib/videos.ts` の `getCourses`/`searchCourses`/`getCourse`/`getVideos`/`getVideo`）は `'use cache'` + `cacheLife` + `cacheTag`。
>   `'use cache'` 内は `cookies()` 不可なので、**cookie-free クライアント `lib/supabase/public.ts`** を使う（公開データは RLS で全員参照可＝匿名で読める）。
> - 無効化は管理アクション（Server Action）内で **`updateTag('courses'|'videos'|`course-${id}`|`videos-${courseId}`…)`**（read-your-own-writes）。`revalidateTag` は2引数化されたため Server Action では使わない。
> - 認証など runtime data（`getRequestClaims` 等）を読む箇所は `<Suspense>` の内側に置く（`Header` の `AuthButton`/`SearchBar`、コース詳細の `EnrollSection`）。

**ESLint** uses flat config (`eslint.config.mjs`), not `.eslintrc`.

---

## Next.js App Router ベストプラクティス

### Server / Client コンポーネントの使い分け

- **デフォルトはServer Component** — `'use client'` は必要な場合のみ付ける
- `'use client'` が必要なケース：`useState` / `useEffect` など React hooks を使う、ブラウザ API（`window`, `localStorage`）を使う、イベントハンドラを直接バインドする
- クライアント境界はできるだけ末端の葉コンポーネントに押し込める（ツリー全体をクライアントにしない）
- Server Component から Client Component へ渡せるのはシリアライズ可能な値のみ（関数・クラスインスタンス不可）

```
// Good: ページはServer、インタラクティブ部分だけClient
app/courses/[id]/page.tsx        ← Server Component (データ取得)
app/courses/[id]/EnrollButton.tsx ← 'use client' (ボタンクリック)
```

### データ取得

- **Server Component 内で直接 fetch / DB アクセス** する — `useEffect` + API ルートの往復は避ける
- 並列で取得できるものは `Promise.all` でまとめる
- ウォーターフォールを防ぐため、必要なデータを1箇所でまとめて取得してから子へ渡す

```tsx
// Good
const [course, videos] = await Promise.all([
  getCourse(id),
  getVideos(id),
])
```

### ローディング・エラー UI

- `loading.tsx` — ルートセグメント単位のスケルトン UI。自動的に `<Suspense>` でラップされる
- `error.tsx` — ルートセグメント単位のエラー境界。**必ず `'use client'`** を付ける
- `not-found.tsx` — `notFound()` 呼び出し時に表示される 404 UI

```
app/courses/
  [id]/
    page.tsx
    loading.tsx    ← コース詳細のスケルトン
    error.tsx      ← 'use client' 必須
    not-found.tsx
```

### ナビゲーション・リダイレクト

- **`<Link>` を使う** — `<a href>` は使わない（プリフェッチ・SPA 遷移が効かなくなる）
- Server Component 内のリダイレクトは `redirect()` (`next/navigation`)
- Client Component 内のプログラム遷移は `useRouter().push()`
- 認証ガードは `middleware.ts`（プロジェクトルート）か Server Component の先頭で行い、クライアント側に認証ロジックを持たせない

### Server Actions

- フォーム送信・データ変更は **Server Actions** を使う（API ルートを経由しない）
- `'use server'` ディレクティブをファイル先頭またはアクション関数に付ける
- 変更後は `revalidatePath()` / `updateTag()` でキャッシュを更新する（Server Action 内は read-your-own-writes の `updateTag`）
- **入力は信頼しない**：FormData・引数（ID/role/検索語等）は `lib/schemas.ts` の **Zod** スキーマで `safeParse` してから使う。失敗時は `{ error }` を返す（`firstError()` でメッセージ取得）。UUID は `uuidSchema`、role は `roleSchema`、フォームは `courseFormSchema`/`videoFormSchema`

```tsx
// app/admin/courses/actions.ts
'use server'
import { revalidatePath } from 'next/cache'

export async function createCourse(formData: FormData) {
  // DB 書き込み
  revalidatePath('/courses')
}
```

### レイアウト・テンプレート

- `layout.tsx` — 子ルート間でアンマウントされない共有 UI（ナビバー、サイドバー）
- `template.tsx` — ルート遷移のたびに再マウントが必要な場合のみ使う（通常は `layout.tsx` で足りる）
- ネストしたレイアウトで認証チェックを行い、未認証なら `redirect('/auth/login')` する

### Metadata

- 静的メタデータは `export const metadata: Metadata = { ... }` でファイル上部に定義
- 動的メタデータ（コースタイトルなど）は `generateMetadata()` を使う

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const course = await getCourse(id)
  return { title: course.title }
}
```

### その他の規則

- **`next/image`** を使う — `<img>` タグは使わない（最適化・LCP 改善）
- **`next/font`** でフォントを読み込む — 外部 CSS `@import` は避ける
- `app/` 配下のファイルはルートに直接関係するもののみ置く。共有コンポーネントは `components/`、ユーティリティは `lib/`、型定義は `types/` に置く
- API ルート（`route.ts`）は外部 webhook やサードパーティコールバック専用。内部データ取得には使わない

---

## Supabase SSR クライアントの作成ルール

### インストール

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 環境変数

`.env.local` に以下を設定する：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

- **新しいキー形式を使う** — `sb_publishable_xxx` / `sb_secret_xxx` を使い、レガシーの `anon` キーは使わない

### 2種類のクライアントを用意する

| クライアント | 用途 |
|---|---|
| Browser client | `'use client'` コンポーネント（ブラウザ実行） |
| Server client | Server Components・Server Actions・Route Handlers |

Server Components はCookieの書き込みができないため、期限切れトークンのリフレッシュとCookie保存に **Proxyパターン** が必要。

### Proxyパターンの3つの責務

1. `supabase.auth.getClaims()` でトークンをリフレッシュする
2. リフレッシュ済みトークンを `request.cookies.set` でServer Componentsに渡す
3. 更新済みトークンを `response.cookies.set` でブラウザに送り返す

### 認証検証のルール（重要）

**サーバーコードでは必ず `supabase.auth.getClaims()` を使う — `supabase.auth.getSession()` は使わない。**

- `getClaims()` — 呼び出しのたびに公開鍵でJWT署名を検証する（安全）
- `getSession()` — トークン再検証を保証しない（サーバーサイドでは信頼できない）

### クライアント生成のコスト

- Supabaseクライアントの生成は軽量
- サーバー側ではリクエストごとにCookieが変わるため、**リクエストのたびに再生成する**
- クライアント側では `createBrowserClient` が自動でシングルトン管理するため再生成不要

### CDNキャッシュの注意

ISRやCDNを使う場合、`Set-Cookie` ヘッダーを含むレスポンスがキャッシュされると、あるユーザーのセッションが別ユーザーに漏洩する恐れがある。Supabaseクライアントから返される `Cache-Control` / `Expires` / `Pragma` ヘッダーをHTTPレスポンスに必ず適用すること。

---

## 公開前セキュリティ / 品質チェックリスト

[catnose 氏のチェックシート](https://zenn.dev/catnose99/articles/547cbf57e5ad28)（2024-07-04 公開）を本スタック（Next.js 16 + Supabase, Google OAuth のみ, 課金なし）向けに最新化したもの。**2026-06-03 時点**で、OWASP ASVS 5.0 と現行 MDN の実務寄りガイドラインを反映している。`✅=対応済 / ⚠️=未対応 / —=対象外`。**機能追加時はこの表で回帰チェックすること。**

### セキュリティ
| 項目 | 状態 | メモ |
|---|---|---|
| サーバ側入力バリデーション | ✅ | Zod（`lib/schemas.ts`）を全 Server Action に適用 |
| XSS（出力エスケープ・`dangerouslySetInnerHTML` 不使用） | ✅ | React 自動エスケープ。`javascript:` 等は `safeRedirectPath` で排除 |
| SQL/クエリインジェクション | ⚠️ | Supabase は基本パラメータ化。検索の `.or()` 文字列のみカンマ/括弧エスケープ未対応（公開テーブルのため影響小） |
| 認可（更新・削除前の権限確認 / WHERE 句） | ⚠️ | 現状は DB の RLS / RPC 権限が真の境界。`app/admin/.../actions.ts` 側では管理者再確認をほぼしていないため、公開前に実 DB の policy / grant / function 権限を再確認する |
| Cookie 属性（`HttpOnly` / `Secure` / `SameSite`） | ✅ | `@supabase/ssr` の認証 Cookie に依存。独自に機微情報を非 HttpOnly Cookie や `localStorage` に保存しない。独自 Cookie を追加する場合は `__Host-` か `__Secure-` 接頭辞を優先 |
| CSRF / クロスサイト POST 対策 | ⚠️ | state-changing endpoint で `GET` を使わないことに加え、`Origin` / `Sec-Fetch-Site` 検証、またはフレームワーク組み込み保護の確認を行う。特に logout・role変更・作成/更新/削除系は公開前に実機確認 |
| **HTTP セキュリティヘッダー** | ⚠️ | **未設定**。`next.config.ts` の `headers()` で付与する（下記）。最優先ギャップ |
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
- 必要に応じて `Cross-Origin-Resource-Policy: same-site` を同一サイト専用アセットへ適用する（外部埋め込みや CDN 配信に影響しない範囲で）
- CSP は最も強力だが Next の nonce / 外部リソース整理が必要。まず `Report-Only` で破壊範囲を確認してから本適用する

### SEO / OGP
| 項目 | 状態 | メモ |
|---|---|---|
| `<title>` / 説明 / 動的 metadata | ✅ | 各ページで `metadata` / `generateMetadata` |
| 検索・エラーページの `noindex` | ⚠️ | `/search` や結果ページは `robots: { index: false }` を付与すべき |
| OGP / Twitter Card（`og:image` 等） | ⚠️ | 現状 title/description のみ。`openGraph`/`twitter` 画像未設定 |
| XML サイトマップ | ⚠️ | `app/sitemap.ts` 未作成 |

### メール / 課金
いずれも **対象外**（認証メールは Supabase 管理、SPF/DKIM/DMARC は Supabase 側。アプリ独自の送信メール・課金は MVP スコープ外）。

### アクセシビリティ / パフォーマンス
| 項目 | 状態 | メモ |
|---|---|---|
| 画像 alt / アイコンボタンの `aria-label` | ✅ | `CourseCard`・検索/クリアボタン等で付与済 |
| レイアウトシフト防止（aspect-ratio / width/height） | ✅ | `next/image` の `fill`＋`aspect-video` |
| DB インデックス | ✅ | `videos(course_id, "order")` 追加済（FK 検索） |
| バンドルサイズ / 静的アセット CDN | ⚠️ | 公開前に `next build` のバンドル分析・配信 CDN を確認 |
