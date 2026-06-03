# 011 DB role による管理者判定（手動昇格）

## 概要
管理者判定を、固定メール（[010](./010_unify_login_admin_email.md)）から **`public.users.role = 'admin'` の DB 判定**に戻す。全ユーザーは Google OAuth でサインアップし、トリガー `handle_new_user()` により `role='user'` で作成される。admin への昇格は Supabase 上で `users.role` を手動変更（user ⇔ admin）することで行い、それに応じて利用できる機能が切り替わる。ログイン統一（`/auth/login` 一本化）は 010 のまま維持する。

**設計方針（ベストプラクティス）**
- 認可は **DB を信頼できる源**とする（誰を admin にするかをコードに固定しない）。運用で role を切り替えるだけで権限が変わる。
- 管理者判定は **単一の関数 `lib/auth.ts#isAdminById(supabase, userId)`** に集約し、middleware・layout・遷移ロジックがこれを参照する。
- ユーザー特定は `getClaims().sub`（署名検証済み）。role 照会は **RLS 本人参照ポリシー**（`auth.uid() = id`）の範囲内なので、各クライアントは自分の role のみ取得する。
- ガードは **多層防御**：middleware（一次）＋ `(protected)/layout.tsx`（二次）。

---

## DB 現状（Supabase MCP で確認）

- `public.users.role` … `text`、既定値 `'user'`、check 制約 `role IN ('user','admin')`
- トリガー `on_auth_user_created`（AFTER INSERT ON `auth.users`）→ `handle_new_user()` が `insert into public.users (id, role) values (new.id, 'user')`（SECURITY DEFINER）
- RLS：`public.users` は「本人のみ参照」（`auth.uid() = id`）の SELECT ポリシー
- → **DB はそのまま要件を満たすためスキーマ変更なし**

---

## Todo

### コード（メール判定 → DB role 判定へ）
- [x] `lib/auth.ts`：`ADMIN_EMAIL` / `isAdminEmail` を削除し、`isAdminById(supabase, userId)` を実装する
- [x] `defaultPathForCurrentUser()` を `getClaims().sub` + `isAdminById()` ベースに変更する
- [x] `lib/supabase/middleware.ts`：`isAdminById()` で `/admin` ガードを行う
- [x] `app/admin/(protected)/layout.tsx`：`isAdminById(claims.sub)` で二次ガードを行う

### データ（サンプル admin の用意）
- [x] `challengevolley1979@gmail.com` の `users.role` を `admin` に更新（Supabase MCP）。他ユーザーは `user` のまま
- [x] 運用手順：admin の追加/削除は `update public.users set role = 'admin'|'user' where id = …` で行う

### 確認・ドキュメント
- [x] `npm run build` / `npm run lint` が通ることを確認する
- [x] CLAUDE.md の管理者判定の記述を DB role ベースに更新する
- [x] 010 の管理者判定節に supersede 注記を付ける

---

## 運用メモ：role の切り替え方
```sql
-- 昇格（admin にする）
update public.users u set role = 'admin'
from auth.users au where au.id = u.id and au.email = '対象メール';

-- 降格（user に戻す）
update public.users u set role = 'user'
from auth.users au where au.id = u.id and au.email = '対象メール';
```
変更後、対象ユーザーは次回のトークンリフレッシュ／再ログイン以降、`/admin` への到達可否が切り替わる（判定はリクエストごとに DB を照会するため、概ね即時反映）。
