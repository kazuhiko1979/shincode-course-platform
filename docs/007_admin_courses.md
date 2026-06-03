# 007 管理画面 — コース管理

## 概要
`/admin/courses` 以下 — コースのCRUD管理。`role = 'admin'` のユーザーのみアクセス可能。

---

## Todo

### アクセス制御
- [x] `app/admin/layout.tsx` — `getClaims()` で role を確認し、`admin` 以外は `/` にリダイレクト
- [x] `/admin/login` ページ（Google OAuth 経由でログインさせる、通常の `/auth/login` を流用でも可）

### コース一覧
- [x] `app/admin/courses/page.tsx` — コース一覧ページ
  - 全コースを `order` 昇順で表示する
  - 各コースに「編集」「削除」「動画管理」リンクを表示する
  - 「新規コース作成」ボタンを表示する

### コース新規作成
- [x] `app/admin/courses/new/page.tsx` — コース作成フォームページ
- [x] `app/admin/courses/actions.ts` に `createCourse` Server Action を実装する
  - `title`, `description`, `thumbnail_url`, `order` をINSERT
  - `revalidatePath('/courses')` と `revalidatePath('/admin/courses')` を呼ぶ
  - 成功時は `/admin/courses` にリダイレクト

### コース編集
- [x] `app/admin/courses/[id]/edit/page.tsx` — コース編集フォームページ（既存データを初期値にセット）
- [x] `app/admin/courses/actions.ts` に `updateCourse` Server Action を実装する
  - `revalidatePath` でパブリック・管理画面の両方を更新する

### コース削除
- [x] `app/admin/courses/actions.ts` に `deleteCourse` Server Action を実装する
  - 関連する `videos`, `enrollments`, `video_progress` も CASCADE 削除（または明示的に削除）
  - `revalidatePath` を呼ぶ
- [x] 削除前に確認ダイアログを表示する（`'use client'` コンポーネント）

### フォームコンポーネント
- [x] `components/admin/CourseForm.tsx` — 新規作成・編集で共用するフォーム（`'use client'`）
  - バリデーション：`title` は必須
