# 008 管理画面 — 動画管理

## 概要
`/admin/courses/[id]/videos` 以下 — コースに紐づく動画のCRUD管理。`role = 'admin'` のユーザーのみアクセス可能。

---

## Todo

### 動画一覧
- [x] `app/admin/courses/[id]/videos/page.tsx` — コース内の動画一覧ページ
  - 動画を `order` 昇順で表示する
  - 各動画に「編集」「削除」リンクを表示する
  - 「動画を追加する」ボタンを表示する
  - コース名をページタイトルに表示する

### 動画新規追加
- [x] `app/admin/courses/[id]/videos/new/page.tsx` — 動画追加フォームページ
- [x] `app/admin/courses/[id]/videos/actions.ts` に `createVideo` Server Action を実装する
  - `course_id`, `title`, `description`, `youtube_url`, `order` をINSERT
  - `revalidatePath` でコース詳細・管理画面の両方を更新する
  - 成功時は `/admin/courses/[id]/videos` にリダイレクト

### 動画編集
- [x] `app/admin/courses/[id]/videos/[videoId]/edit/page.tsx` — 動画編集フォームページ
- [x] `app/admin/courses/[id]/videos/actions.ts` に `updateVideo` Server Action を実装する
  - `revalidatePath` を呼ぶ

### 動画削除
- [x] `app/admin/courses/[id]/videos/actions.ts` に `deleteVideo` Server Action を実装する
  - 関連する `video_progress` も削除する
  - `revalidatePath` を呼ぶ
- [x] 削除前に確認ダイアログを表示する（`'use client'` コンポーネント）

### フォームコンポーネント
- [x] `components/admin/VideoForm.tsx` — 新規追加・編集で共用するフォーム（`'use client'`）
  - バリデーション：`title`, `youtube_url` は必須
  - `youtube_url` は YouTube URL 形式かチェックする

### YouTube URL ユーティリティ
- [x] `lib/youtube.ts` に `extractYouTubeId(url)` ユーティリティを実装する（動画ページの埋め込みでも使用）
