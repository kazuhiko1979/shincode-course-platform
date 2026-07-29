@AGENTS.md

> **ルールの読み込み方針**：`.claude/rules/backend/patterns.md`・`.claude/rules/frontend/patterns.md` は
> フロントマターの `paths:`（glob）による **path-specific rules**（Claude Code ネイティブ機能）。
> 該当ファイルを操作する時だけ自動でコンテキストに読み込まれる（Select 戦略）。
> `@import` で常時読み込みにはしない（二重ロード・コンテキスト浪費を避けるため）。

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
npm run dev        # start dev server at http://localhost:3000
npm run build      # production build（型チェックも兼ねる）
npm run start      # start production server
npm run lint       # run ESLint
npm run typecheck  # tsc --noEmit（型チェックのみ・高速）
npm run verify     # lint → typecheck → build を一括実行（完了前に必ず通す）
```

No test runner is configured. 代わりに **`npm run verify`** を「テストを必ず実行する」の正規ゲートとして使う（完了主張の前に実行し、出力を提示する）。CI（`.github/workflows/ci.yml`）でも PR / main push 時に同等の検証が走る。

### その他のコマンド

```bash
node scripts/perf-bench.mjs   # 主要ページの簡易パフォーマンス計測
```

- **push は `/push-review` 経由**（code / security / performance の3レビュアーを並列実行し、ブロッカーが無ければ push）。`git push` の直叩き・`--force` は禁止。詳細は `.claude/commands/push-review.md`。
- エージェント作業時の安全ルール（変更禁止ゾーン・spec-first・最小差分・検証義務・Git 安全則）は `AGENTS.md` の「エージェント作業の安全ルール」を参照。

## コーディング規約

### 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| コンポーネントファイル | PascalCase | `CourseCard.tsx`, `AuthButton.tsx` |
| lib / util ファイル | camelCase | `courses.ts`, `auth.ts` |
| 型定義（`types/`） | PascalCase type alias | `type Course = { ... }` |
| React コンポーネント関数 | PascalCase | `export default function CourseCard` |
| lib 関数 | camelCase | `getCourses`, `createClient` |
| Server Action | camelCase 動詞始まり | `createCourse`, `setUserRole` |
| Zod スキーマ | camelCase + `Schema` suffix | `courseFormSchema`, `uuidSchema` |
| Zod infer 型 | PascalCase + `Input` suffix | `type CourseInput = z.infer<...>` |

### TypeScript

- `interface` より `type` を使う（既存コードとの一貫性）
- `any` を使わない — 不明な型は `unknown` で受けて narrowing する
- 型のみの import は `import type` を使う
- `@/` エイリアスを使う — 相対パス（`../`）は使わない

---

## 開発ワークフロー

### コミット規約

Conventional Commits 形式を使う：`<type>: <件名（日本語可）>`

| type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `refactor` | 動作変更なしのリファクタリング |
| `style` | フォーマット・空白のみ（ロジック変更なし） |
| `chore` | 依存関係更新・設定変更など |

- 件名は命令形・現在形（「追加」「修正」「削除」）で書く
- 1コミット1目的 — 無関係な変更を混ぜない
- `closes #番号` でイシューをクローズできる場合は件名末尾に付ける

### ブランチ命名

`<type>/<kebab-case-description>` — 例：`feat/video-progress`、`fix/auth-redirect`

### テスト方針

テストランナーは未設定。代わりに以下を必ず行う：

- コード変更後は `npm run lint` を通す（エラーは修正してからコミット）
- UI 変更・新機能は `npm run dev` で動作確認してからコミット
- Server Action の変更は実際にフォーム送信して結果を確認する
- 認証まわりの変更は未ログイン・一般ユーザー・管理者の3ロールで確認する

### コミット前チェックリスト

- [ ] `npm run lint` がエラーなし
- [ ] `npm run build` が通る（型エラーなし）
- [ ] `.env*` ファイルをステージングしていない

---

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

