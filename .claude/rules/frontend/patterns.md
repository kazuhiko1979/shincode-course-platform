---
paths:
  - "app/**/*.tsx"
  - "app/**/*.ts"
  - "components/**/*.tsx"
---

## Next.js 16 Breaking Changes

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

## Server / Client コンポーネントの使い分け

- **デフォルトはServer Component** — `'use client'` は必要な場合のみ付ける
- `'use client'` が必要なケース：`useState` / `useEffect` など React hooks を使う、ブラウザ API（`window`, `localStorage`）を使う、イベントハンドラを直接バインドする
- クライアント境界はできるだけ末端の葉コンポーネントに押し込める（ツリー全体をクライアントにしない）
- Server Component から Client Component へ渡せるのはシリアライズ可能な値のみ（関数・クラスインスタンス不可）

```
// Good: ページはServer、インタラクティブ部分だけClient
app/courses/[id]/page.tsx        ← Server Component (データ取得)
app/courses/[id]/EnrollButton.tsx ← 'use client' (ボタンクリック)
```

## データ取得

- **Server Component 内で直接 fetch / DB アクセス** する — `useEffect` + API ルートの往復は避ける
- 並列で取得できるものは `Promise.all` でまとめる
- ウォーターフォールを防ぐため、必要なデータを1箇所でまとめて取得してから子へ渡す

```tsx
const [course, videos] = await Promise.all([
  getCourse(id),
  getVideos(id),
])
```

## ローディング・エラー UI

- `loading.tsx` — ルートセグメント単位のスケルトン UI。自動的に `<Suspense>` でラップされる
- `error.tsx` — ルートセグメント単位のエラー境界。**必ず `'use client'`** を付ける
- `not-found.tsx` — `notFound()` 呼び出し時に表示される 404 UI

```
app/courses/[id]/
  page.tsx
  loading.tsx    ← コース詳細のスケルトン
  error.tsx      ← 'use client' 必須
  not-found.tsx
```

## ナビゲーション・リダイレクト

- **`<Link>` を使う** — `<a href>` は使わない（プリフェッチ・SPA 遷移が効かなくなる）
- Server Component 内のリダイレクトは `redirect()` (`next/navigation`)
- Client Component 内のプログラム遷移は `useRouter().push()`
- 認証ガードは `proxy.ts`（middleware）か Server Component の先頭で行い、クライアント側に認証ロジックを持たせない

## Server Actions

- フォーム送信・データ変更は **Server Actions** を使う（API ルートを経由しない）
- `'use server'` ディレクティブをファイル先頭またはアクション関数に付ける
- 変更後は `revalidatePath()` / `updateTag()` でキャッシュを更新する（Server Action 内は read-your-own-writes の `updateTag`）
- **入力は信頼しない**：FormData・引数（ID/role/検索語等）は `lib/schemas.ts` の **Zod** スキーマで `safeParse` してから使う。失敗時は `{ error }` を返す（`firstError()` でメッセージ取得）。UUID は `uuidSchema`、role は `roleSchema`、フォームは `courseFormSchema`/`videoFormSchema`

## レイアウト・テンプレート

- `layout.tsx` — 子ルート間でアンマウントされない共有 UI（ナビバー、サイドバー）
- `template.tsx` — ルート遷移のたびに再マウントが必要な場合のみ使う（通常は `layout.tsx` で足りる）
- ネストしたレイアウトで認証チェックを行い、未認証なら `redirect('/auth/login')` する

## Metadata

- 静的メタデータは `export const metadata: Metadata = { ... }` でファイル上部に定義
- 動的メタデータ（コースタイトルなど）は `generateMetadata()` を使う

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const course = await getCourse(id)
  return { title: course.title }
}
```

## その他の規則

- **`next/image`** を使う — `<img>` タグは使わない（最適化・LCP 改善）
- **`next/font`** でフォントを読み込む — 外部 CSS `@import` は避ける
- `app/` 配下のファイルはルートに直接関係するもののみ置く。共有コンポーネントは `components/`、ユーティリティは `lib/`、型定義は `types/` に置く
- API ルート（`route.ts`）は外部 webhook やサードパーティコールバック専用。内部データ取得には使わない

## CSS / スタイリング

- Tailwind CSS のみ使用 — インライン `style={}` は使わない
- 繰り返すクラス文字列はコンポーネント外の定数に抽出する
- カスタムカラーは HEX で直指定（`text-[#1c1d1f]`）。プロジェクト固有色を任意に追加しない

## コンポーネント

- `export default` を使う（コンポーネント）
- named export を使う（Server Actions・複数エクスポート・型）
- props 型は単純なら inline、複雑（3つ以上 or 再利用）なら named type
