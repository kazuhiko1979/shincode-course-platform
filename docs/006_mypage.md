# 006 マイページ

## 概要
`/mypage` 以下 — ログイン済みユーザーの受講中コース一覧と進捗確認ページ。未ログインは `/auth/login` にリダイレクト。

---

## Todo

### データ取得
- [x] `lib/enrollments.ts` に `getEnrollments(userId)` を実装する（コース情報をJOIN）
- [x] `lib/video_progress.ts` に `getCourseProgress(userId, courseId)` を実装する（完了数/全体数）

### レイアウト
- [x] `app/mypage/layout.tsx` — 認証チェック（未ログインなら `redirect('/auth/login')`）
- [x] マイページ共通のサイドナビまたはヘッダーを配置する

### ページ実装
- [x] `app/mypage/page.tsx` — マイページトップ（`/mypage/courses` にリダイレクトでも可）
- [x] `app/mypage/courses/page.tsx` — 受講中コース一覧
  - 登録コースをカード形式で表示する
  - 各カードに進捗バー（完了動画数 / 全動画数）を表示する
  - コース詳細へのリンク（`/courses/[id]`）
  - 登録コースが0件の場合の空状態UIを表示する
- [x] `app/mypage/courses/[id]/page.tsx` — 受講コースの進捗詳細
  - コース内の動画リストを表示する
  - 各動画に視聴済み/未視聴のアイコンを表示する
  - 全体の進捗率を表示する

### ローディング・エラー
- [x] `app/mypage/courses/loading.tsx` — スケルトンUI
- [x] `app/mypage/courses/error.tsx` — エラー境界（`'use client'` 必須）
