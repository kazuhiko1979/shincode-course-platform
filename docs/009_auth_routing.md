# 009 認証ルーティング改善（ログイン画面の区別・受講登録導線・ロール別リダイレクト）

## 概要
ログイン画面を「一般ユーザー向け」「管理者向け」で区別し、非ログオンユーザーの受講登録時に登録/ログインを促す。ログイン後は一般ユーザーをマイページ、管理者を管理画面へ遷移させる。

**設計方針（ベストプラクティス）**
- 認証手段は Google OAuth の **1つだけ**（別認証システムを増やさない）。区別するのは「入口ページの文言／既定の遷移先」のみ。
- 認可（role）は **サーバー側で `users.role` から判定**する。どのボタンを押したかで決めない。
- 遷移先は `next`（安全な相対パス）→ 無ければ **role 別デフォルト**（admin→`/admin`, user→`/mypage`）。
- **オープンリダイレクト対策**を必須とする。

---

## Todo

### 共通：安全なリダイレクト基盤
- [x] `lib/auth.ts`（または `lib/safe-redirect.ts`）に `safeRedirectPath(next, fallback)` を実装する
  - `/` 始まりの相対パスのみ許可。`//`・`\`・絶対URL（`http(s)://`）は拒否しフォールバックを返す
- [x] `app/auth/login/GoogleLoginButton.tsx` に `next` プロップを追加し、`redirectTo` に付与する
  - `redirectTo: ${origin}/auth/callback?next=${encodeURIComponent(next)}`
- [x] `app/auth/callback/route.ts` を改修する
  - `next` を受け取り `safeRedirectPath` で検証 → あればそこへ
  - 無ければ `users.role` を照会し admin→`/admin`、user→`/mypage` へ
  - エラー時は `/auth/login?error=callback` のまま

### 一般ユーザーログイン（`/auth/login`）
- [x] 学習者向けの文言に調整する（「無料登録して学習を始める」等、Google OAuth が新規登録も兼ねる旨を明記）
- [x] `searchParams.next` を受け取り `GoogleLoginButton` に渡す
- [x] ログイン済みでアクセスした場合の遷移先を `next` 優先・無ければ role 別にする

### 管理者ログイン（`/admin/login`）

> ⚠️ **本節は [010](./010_unify_login_admin_email.md) で置き換え済み**：ログインは `/auth/login` に統一し `/admin/login` は廃止。管理者判定は `users.role` ではなく固定メール（`ADMIN_EMAIL`）で行う。以下のチェックは当時の実装記録として残す。

- [x] 管理者向けログインUIを実装する（管理画面ログインである旨を明示、既定 `next=/admin`）
- [x] `/admin/login` を admin ガードの対象から外す
  - ルートグループで分離（例：保護対象を `app/admin/(protected)/` に移し、そこにガード layout を置く。`app/admin/login` はガード外に）
- [x] `lib/supabase/middleware.ts`：非ログインでも `/admin/login` は許可する（`!user` のリダイレクト対象から除外）
- [x] 認証後に admin 以外がアクセスした場合は `/` へ（権限が無い旨のメッセージを表示）

### 非ログオンユーザーの受講登録導線
- [x] コース詳細（`app/courses/[id]/page.tsx`）のゲスト時ボタンを `/auth/login?next=/courses/[id]` へ誘導する
  - 文言を「登録して受講する」等、登録を促すものにする
- [x] （任意）ログイン後の自動受講登録：`next` に受講意図（例 `?enroll=1`）を載せ、コース詳細復帰時に `enrollCourse` を実行する 〔Udemy方針で実装〕

### ロール別の着地確認
- [x] 一般ユーザーはログイン後 `/mypage`、管理者は `/admin` に着地することを確認する
- [x] （任意）ヘッダーの「ログイン」リンクに現在ページを `next` として付与する 〔Udemy方針で実装〕

### ドキュメント更新
- [x] CLAUDE.md のルート構成に `/admin/login`（ガード外）の扱いを追記する
- [x] middleware の matcher / 除外ルールの変更を反映する

---

## 補足・確認事項
- **自動受講登録（任意項目）**：実装するとUXは向上するが、OAuth往復をまたいで意図を保持する必要があり複雑度が上がる。MVPでは「ログイン後にコースへ復帰 → 受講ボタンを押す」標準ログインウォールでも要件は満たせる。
- **既存のリダイレクト**：現状 callback は常に `/` へ。本チケットで role/`next` ベースに置き換える。
