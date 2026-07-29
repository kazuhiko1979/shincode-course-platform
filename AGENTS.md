<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Review guidelines

このリポジトリのコードレビュー基準。重要度順（Critical → High → Medium → Low）に、根拠とともに具体的な該当箇所（`file:line`）を挙げること。詳細な規約は `CLAUDE.md` を参照。

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

---

## エージェント作業の安全ルール（必須・人間/Claude/Codex 共通）

AI エージェントが安全に開発するための行動規範。**このファイルが正典**で、`CLAUDE.md` からも `@import` される。以下は「レビュー基準」ではなく「作業手順の遵守事項」。迷ったら停止して人間に確認する。

### 1. 変更禁止ゾーン（人間の明示承認なしに触らない）

以下は事故の影響が大きい、または認可・セキュリティ境界そのもの。**変更・実行の前に必ず人間へ確認し、承認を得てから**行う。

- **DB スキーマ / RLS / `SECURITY DEFINER` 関数**（`is_admin` / `admin_*` / `handle_new_user` など）。
- **Supabase MCP のリモート書き込み**：`apply_migration` と、DDL/DML を伴う `execute_sql`（`INSERT`/`UPDATE`/`DELETE`/`ALTER`/`DROP`/`GRANT`/`REVOKE` 等）。読み取り（`SELECT`）・`list_*`・`get_advisors` は可。
- **`next.config.ts` のセキュリティヘッダー**（HSTS / CSP / `frame-ancestors` / `X-Frame-Options` / Referrer-Policy / Permissions-Policy）の削除・緩和。
- **レビュー機構**：`.claude/agents/*`・`.claude/commands/*`・`.claude/agent-memory/*`（チェックを弱める変更）。
- **依存関係**：`package.json` への依存追加・削除・アップグレード（供給網・破壊的変更リスク）。

### 2. spec-first（勝手な仕様追加の禁止）

- 対応する `docs/` のチケットが無い変更は**着手前に停止**し、起票または人間確認を行う（`docs/000_index.md` が一覧）。
- MVP スコープ外（課金・コメント/Q&A・クイズ・複数講師）は**実装しない**。要望が来たら「スコープ外」と明示して確認する。
- 指示された範囲を超える機能・オプション・抽象化を勝手に足さない（YAGNI）。仕様と実装に差異が出たら `⚠️` で理由を併記する。

### 3. 最小差分の原則（変更範囲を小さく）

- チケット達成に必要なファイルだけを変更する。**ついでのリファクタ・整形・リネーム・import 並べ替えを混ぜない**（必要なら別チケット・別コミット）。
- 広域リネームや一括置換は、対象範囲を人間に提示して承認を得てから。
- 1 コミット 1 目的。1 PR 1 論理変更。大きくなるならチケットを分割する。

### 4. 検証の義務（テストを必ず実行する）

- 「完了」「修正した」「通った」と主張する前に、必ず `npm run verify`（= lint → typecheck → build）を実行し、**その出力を提示する**。実行していないなら「未検証」と明記する（推測で完了宣言しない）。
- 認証・認可に関わる変更は、未ログイン / 一般ユーザー / 管理者の **3 ロール**で挙動を確認する。
- Server Action の変更は実際にフォーム送信して結果を確認する。UI 変更は `npm run dev` で目視確認する。

### 5. Git 安全則

- `main` へ直接コミットしない。必ず `<type>/<kebab-case>` の feature ブランチで作業する。
- push は `/push-review`（3 レビュアー並列 → 問題なければ push）経由。`git push` 直叩き・`--force` は禁止。
- `git add -A` / `git add .` を使わず、**パスを明示**してステージする。`.env*` は絶対にステージしない。
- コミット・push は人間に依頼されたときだけ行う（勝手に作らない）。

### 6. シークレット非開示

- `.env.local`・`.mcp.json` の値（キー・トークン・URL）を出力・ログ・コミットに出さない。
- `service_role` 相当の秘密鍵をクライアント側コードや公開設定に露出させない。

### 7. 変更報告テンプレ（人間がレビューしやすい出力）

完了報告・PR 本文は次の形にそろえる：

```
## What   … 何を変えたか（1〜3行）
## Why    … なぜ（対応チケット #番号）
## 影響範囲 … 触れたファイル / 影響する画面・ロール
## 検証   … 実行したコマンドと結果（npm run verify の出力、3ロール確認 等）
## スコープ外 … あえてやらなかったこと・別チケット送りにしたこと
```

---

## 設計の軸（ハーネス設計ナレッジ）

AI エージェント開発を一過性でなく **資産として蓄積・洗練**するための永続ナレッジを `docs/harness/` に置く。**Rule/Hook/Skill/サブエージェント/評価などハーネス部品を設計・変更する前に参照すること。**

- [`docs/harness/000_index.md`](docs/harness/000_index.md) — 索引と回し方
- [`docs/harness/01_principles.md`](docs/harness/01_principles.md) — 原則集（W/S/C/I・6制御IF・Hooks・Generator-Evaluator・検証/評価ハーネス）
- [`docs/harness/02_maturity.md`](docs/harness/02_maturity.md) — 本プロジェクトの成熟度採点・ギャップ・導入ロードマップ
- [`docs/harness/03_one-pager.md`](docs/harness/03_one-pager.md) — 1枚まとめ

> **設計哲学：AI の凹みに構造を、でっぱりは安心して任せられるように。モデルが進化しても、設計したハーネス構造は資産として永続する。**
