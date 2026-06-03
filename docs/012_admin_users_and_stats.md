# 012 管理ダッシュボード拡張（ユーザー管理・統計・分析）

## 概要
管理者ダッシュボード（`/admin`）を実ページ化し、以下の機能を追加する。
- **ユーザー管理**（`/admin/users`）：登録ユーザーの一覧と role（user ⇔ admin）の変更
- **統計・分析**（`/admin/stats`）：ユーザー数・コース数・受講登録数・視聴完了数・人気コース・最近の登録ユーザー
- 右アイコン（`UserMenu`）下部に現在の権限（管理者／一般ユーザー）バッジを表示

**設計方針（ベストプラクティス）**
- RLS（`users`/`enrollments`/`video_progress` は本人参照のみ）を緩めず、管理者の横断アクセスは **`SECURITY DEFINER` 関数**に限定する。`auth.users.email` もこの経路でのみ取得。
- 各関数は内部で `is_admin()` を確認し、`anon` には実行権限を与えない（`authenticated` のみ）。
- role 変更は関数 `admin_set_role` に集約し、**値検証＋最後の admin 降格防止**（ロックアウト対策）を DB 側で担保する。
- 既存の admin 判定（`isAdminById` / RLS の admin ポリシー）と一貫させる。

---

## DB（Supabase migration: `admin_user_management_and_stats`）
- [x] `is_admin()` … SECURITY DEFINER。RLS 再帰を避けつつ呼び出し元の admin 判定
- [x] `admin_list_users()` … 全ユーザー（id/email/role/created_at/受講数）を返す（admin のみ）
- [x] `admin_set_role(target_id, new_role)` … role 変更。値検証＋最後の admin 降格を拒否
- [x] `admin_stats()` … 集計値を JSON で返す（users/admins/courses/videos/enrollments/completions/top_courses/recent_signups）
- [x] 実行権限を `authenticated` のみに付与（`anon` は revoke）

## アプリ
- [x] `lib/admin.ts` … `listUsers()` / `getAdminStats()`（`supabase.rpc` ラッパー）
- [x] `app/admin/(protected)/page.tsx` … redirect を廃止し、統計サマリ＋機能カードのダッシュボードに
- [x] `app/admin/(protected)/users/page.tsx` … ユーザー一覧（email・権限バッジ・受講数・登録日・role 切替）
- [x] `app/admin/(protected)/users/actions.ts` … `setUserRole`（`admin_set_role` を呼ぶ Server Action）
- [x] `components/admin/RoleToggleButton.tsx` … role 切替ボタン（client）
- [x] `components/admin/RoleBadge.tsx` … 権限バッジ（admin=紫／user=グレー）
- [x] `app/admin/(protected)/stats/page.tsx` … 統計・分析ページ
- [x] `app/admin/(protected)/layout.tsx` … サブヘッダーに「ユーザー管理」「統計・分析」リンク追加、「管理画面」を `/admin` リンク化
- [x] `components/UserMenu.tsx` … ドロップダウン下部に権限バッジを表示

## 確認
- [x] `npm run build` / `npm run lint` が通る
- [x] RPC を admin/非admin 文脈で検証（admin=全件取得・集計可、user=取得不可）
- [x] CLAUDE.md にルート・管理機能の DB アクセス方針を反映

---

## 補足
- `users.role` を Supabase 上（または `/admin/users`）で手動変更すると、対象ユーザーの権限・ダッシュボード導線が切り替わる（[011](./011_db_role_admin.md)）。
- 最後の管理者を一般ユーザーに変更しようとすると `admin_set_role` がエラーを返し、ロックアウトを防ぐ。
