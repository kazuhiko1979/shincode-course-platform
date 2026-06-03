# 010 ログイン統一・固定メールでの管理者判定

> ⚠️ **管理者判定の方式は [011](./011_db_role_admin.md) で置き換え済み**：固定メール（`ADMIN_EMAIL` / `isAdminEmail`）ではなく `public.users.role = 'admin'` の DB 判定に変更。**ログイン統一（`/admin/login` 廃止）の部分は引き続き有効**。

## 概要
ログイン画面を `/auth/login` に統一し、専用の `/admin/login` を廃止する。管理者判定は DB の `users.role` ではなく、固定メールアドレス（サンプル運用）で行う。`ADMIN_EMAIL`（既定 `challengevolley1979@gmail.com`）のユーザーのみ管理者として `/admin` に着地し、それ以外の Google ログインユーザーは一般ユーザーとして `/mypage` に着地する。

**設計方針（ベストプラクティス）**
- 認証（誰か）と認可（何ができるか）を分離する。認証手段は Google OAuth の1つだけなので、ログイン画面はロールで分けず **1枚に統一**する。
- 管理者判定は **単一の真実の源**（`lib/auth.ts`）に集約し、middleware・layout・遷移ロジックすべてが同じヘルパーを参照する。
- ガードは **多層防御**：middleware（一次）＋ `(protected)/layout.tsx`（二次）。
- 判定は **JWT クレームの `email`**（`getClaims()` で署名検証済み）で行い、DB 照会を不要にする。

---

## Todo

### 管理者判定の集約
- [x] `lib/auth.ts` に `ADMIN_EMAIL` 定数（環境変数 `ADMIN_EMAIL` で上書き可、既定 `challengevolley1979@gmail.com`）と `isAdminEmail(email)` を実装する
- [x] `defaultPathForCurrentUser()` を `getClaims()` + `isAdminEmail()` ベースに変更する（`users.role` 照会を廃止）

### ログイン統一
- [x] `/admin/login` ページを削除する
- [x] `app/auth/login/page.tsx` を `getClaims()` ベースに統一する（共通ログインとして利用）
- [x] `components/LoginLinks.tsx` の `/admin/login` 参照を除去する

### ガード（middleware / layout）
- [x] `lib/supabase/middleware.ts`：`getUser()` → `getClaims()`、未認証 `/admin/*`・`/mypage/*` は `/auth/login?next=<元のパス>` へ
- [x] `lib/supabase/middleware.ts`：認証済みで管理者以外の `/admin/*` アクセスは `/mypage` へ（DB role 照会を `isAdminEmail()` に置換）
- [x] `app/admin/(protected)/layout.tsx`：DB role 照会を `isAdminEmail(claims.email)` に置換、未認証時は `/auth/login?next=/admin` へ

### 確認・ドキュメント
- [x] `npm run build` で型・ビルドが通ることを確認する
- [x] CLAUDE.md のルート構成・管理画面ルート構造・管理者判定の記述を更新する
- [x] 009 の管理者ログイン節に supersede 注記を付ける

---

## 補足
- DB の `users.role` カラムは残置するが本フローでは未使用。将来「複数管理者を DB で管理」へ戻す場合は `isAdminEmail()` の実装を role 照会に差し替えるだけでよい（呼び出し側は変更不要）。
- 一般ユーザーが `next=/admin` を持ってログインした場合は middleware が `/mypage` へ弾き返す（多層防御）。
