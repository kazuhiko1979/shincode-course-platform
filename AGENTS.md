<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Review guidelines

このリポジトリのコードレビュー基準。重要度順（Critical → High → Medium → Low）に、根拠とともに具体的な該当箇所（`file:line`）を挙げること。詳細な規約は `CLAUDE.md` と `.claude/rules/` を参照。

### セキュリティ（最優先）

- **入力バリデーション**：全 Server Action は先頭で `lib/schemas.ts` の Zod スキーマ（`uuidSchema` / `roleSchema` / `courseFormSchema` / `videoFormSchema` / `searchQuerySchema`）を `safeParse` してから使う。外部由来の値（FormData・引数・クエリ）を未検証で DB やリダイレクトに渡していないか。
- **認可の多層防御**：`/admin` 系の Server Action は layout ガードに依存せず、関数先頭で `isCurrentUserAdmin()` を再確認しているか。認証判定は `getClaims()` を使う（`getSession()` は使わない）。
- **所有権チェック（WHERE 句）**：更新・削除は主キーだけでなく所有スコープも制約する（例：video の更新/削除は `.eq('id', ...)` に加え `.eq('course_id', ...)`）。片方だけになっていないか（`updateVideo` と `deleteVideo` の対称性など）。
- **GET で状態変更しない**：作成/更新/削除・受講登録・role 変更などの副作用を GET ルート（`route.ts` の `GET`）や単なるページ描画で行っていないか。
- **オープンリダイレクト**：外部由来の遷移先は必ず `safeRedirectPath` を通す（`//`・バックスラッシュ・`javascript:` 等を排除）。
- **XSS**：`dangerouslySetInnerHTML` を使っていないか。React の自動エスケープを迂回していないか。
- **秘密情報**：`.env*` やキーをコミットしていないか。`service_role` キーをクライアントへ露出していないか。

### Next.js 16（破壊的変更）

- `params` / `searchParams` は Promise。必ず `await` してから使う。
- キャッシュ無効化は Server Action 内で `updateTag(...)`（read-your-own-writes）。`revalidateTag` は使わない。
- 公開データ取得は `'use cache'` + `cacheLife` + `cacheTag`。`'use cache'` 内で `cookies()` を使わない（cookie-free の `lib/supabase/public.ts` を使う）。
- 認証など runtime data を読む箇所は `<Suspense>` の内側に置く。
- `error.tsx` は `'use client'` 必須。

### TypeScript / 命名規則

- `any` 禁止。不明な型は `unknown` で受けて narrowing する。
- `interface` より `type`。型のみの import は `import type`。相対パス（`../`）ではなく `@/` エイリアス。
- 命名：コンポーネント/型は PascalCase、lib/util 関数と Server Action（動詞始まり）は camelCase、Zod スキーマは `xxxSchema`、infer 型は `XxxInput`。

### UI / スタイリング

- `next/image`（`<img>` 不可）、`<Link>`（`<a href>` 不可）を使う。
- Tailwind のみ。インライン `style={}` は使わない。繰り返すクラス文字列は定数化。
- 画像 `alt` / アイコンボタンの `aria-label` を付与。

### Server Action の形

- 戻り値は `{ error?: string }`。`throw` しない（`useActionState` 互換）。
- 実装順序：権限チェック → Zod 検証 → DB 操作 → キャッシュ更新（`updateTag` / `revalidatePath`）→ `return {}`。
- lib（データ取得）はエラーを `throw`、Server Action は `{ error }` を返す。メッセージはユーザー向け日本語。

### 対象外（指摘しない）

課金・決済、コメント・Q&A、クイズ、複数講師対応は MVP スコープ外。テストランナー未設定のためテストコードの有無は指摘不要（代わりに lint / build 通過を前提とする）。
