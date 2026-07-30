# Sprint Contract — ユーザ認証機能

> **ファイルベースの合意文書**：実装前に Generator（作る側）と Evaluator（評価する側）が**完了基準を合意**し、同じゴールに向かう（`docs/harness/01_principles.md` §5）。
> 合意があるから、評価者が後から「そんなの聞いてない」と言わない。過度な仕様書は不要 — **検証可能な完了条件**に焦点を当てる。
>
> **役割分担**：本ファイル＝「何を作るか」「できた／できてない」（**二値判定**）。[`evaluation-rubric.md`](./evaluation-rubric.md)＝「どの程度良いか」（段階評価）。

| 項目 | 内容 |
|---|---|
| スプリント | ユーザ認証機能（Google OAuth・ロール別遷移・保護ルート） |
| 対応チケット | docs/002・009・010・011 |
| Generator | 実装エージェント（Claude Code） |
| Evaluator | 別セッション／サブエージェント／人間（Generator と同一にしない） |
| ステータス | ✅ 実装済み — 本契約は**フォーマットの正典例**兼**回帰検証チェックリスト**として機能する |

---

## 1. 実装スコープ（何を作るか）

- Google OAuth による統一ログイン（`/auth/login`。一般・管理者共通、`?next=` 対応）
- OAuth コールバック（`/auth/callback`。`next` 検証 → ロール別遷移 admin:`/admin`／user:`/mypage`）
- ログアウト（`/auth/logout`）
- 保護ルート：`/mypage/*`（要ログイン）・`/admin/*`（要 `role='admin'`）。middleware（`proxy.ts`／`lib/supabase/middleware.ts`）＋ layout ガードの多層防御
- 管理者判定の一元化（`lib/auth.ts` の `isAdminById`。`public.users.role` を照会）
- オープンリダイレクト対策（外部由来の遷移先は `safeRedirectPath` を通す）

### スコープ外（作らない）

- メール/パスワード認証・MFA・パスワードリセット
- 管理者への昇格 UI（昇格は Supabase 上で `users.role` を手動変更）
- 課金・コメント等の MVP スコープ外全般

## 2. 完了基準（二値判定 — 全項目 Pass でスプリント完了）

各項目は **Pass / Fail のどちらかに必ず判定できる**こと。1つでも Fail なら未完了。

### ゲスト（未ログイン）
- [ ] `/`・`/courses/[id]`・`/search` が未ログインで閲覧できる
- [ ] `/mypage` にアクセスすると `/auth/login?next=/mypage` へリダイレクトされる
- [ ] `/admin` にアクセスすると `/auth/login?next=/admin` へリダイレクトされる

### ログイン遷移
- [ ] Google ログイン成功後、`next` があれば（検証を通過した場合のみ）そこへ遷移する
- [ ] `next` が無ければロール別の既定へ遷移する（admin → `/admin`、user → `/mypage`）
- [ ] `next` に `//evil.com`・`javascript:`・バックスラッシュ・絶対 URL を渡すと拒否され、フォールバック先へ遷移する（`safeRedirectPath`）

### 一般ユーザー
- [ ] `/mypage` 系が表示できる
- [ ] `/admin/*` にアクセスすると `/mypage` へ逃がされる（403 画面や白画面にしない）

### 管理者
- [ ] `/admin`（ダッシュボード）と `/admin/courses` 等が表示できる

### ログアウト
- [ ] ログアウト後、保護ページへ再アクセスするとログインへリダイレクトされる

### 実装規約（コードで確認）
- [ ] サーバー側の認証判定はすべて `getClaims()`（`getSession()` の使用が 0 件）
- [ ] 管理者判定は `isAdminById`（`users.role='admin'`）に集約され、middleware・layout・Server Action が同じ関数を参照する
- [ ] `/admin` 系 Server Action は layout ガードに依存せず関数先頭で管理者を再確認する
- [ ] `npm run verify`（lint→typecheck→build）が通る

## 3. 検証方法（どうやって確認するか）

1. **3ロール手動確認**（`npm run dev`）：未ログイン／一般ユーザー／管理者の3ブラウザ状態で §2 の各項目を実施（Playwright MCP での自動操作も可）
2. **コード確認**：`getSession` の grep が 0 件・`isAdminById` の参照箇所・Server Action 先頭の権限チェックを Read/Grep で確認
3. **ゲート**：`npm run verify` の出力を提示
4. Evaluator は結果を **Pass/Fail の表**で報告し、Fail には再現手順を添える

---

## 運用ルール（新スプリントでこのファイルを使うとき）

1. 実装**着手前**に、本フォーマット（スコープ／スコープ外／完了基準／検証方法）で新しい契約を書き、人間が確定する
2. 完了基準は**二値で検証可能**な文になっているかを確認（「使いやすい」等の程度表現は rubric へ）
3. スコープ変更が生じたら契約を**先に更新**してから実装する（spec-first）
4. Generator の「完了しました」は受理しない — **Evaluator が全項目 Pass を確認**してはじめて完了
