# 004 コース詳細ページ

## 概要
`/courses/[id]` — コースの説明と動画一覧を表示するページ。認証不要でゲストも閲覧可能。ログイン済みユーザーは受講登録できる。

---

## Todo

### データ取得
- [x] `lib/courses.ts` に `getCourse(id)` 関数を実装する
- [x] `lib/videos.ts` に `getVideos(courseId)` 関数を実装する（`order` 昇順）
- [x] `lib/enrollments.ts` に `getEnrollment(userId, courseId)` を実装する
- [x] `Promise.all` でコース・動画・受講状態を並列取得する

### ページ実装
- [x] `app/courses/[id]/page.tsx` を Server Component として実装する
- [x] `params` は必ず `await` してから使う（Next.js 16）
- [x] コース情報（サムネイル、タイトル、説明）を表示する
- [x] 動画一覧を順番に表示する（各動画は `/courses/[id]/videos/[id]` へのリンク）
- [x] ログイン済みで未登録の場合に「受講登録する」ボタンを表示する
- [x] 登録済みの場合は「受講中」バッジを表示する
- [x] コースが存在しない場合は `notFound()` を呼ぶ

### 受講登録
- [x] `app/courses/[id]/actions.ts` に `enrollCourse` Server Action を実装する
- [x] `enrollments` テーブルに INSERT する
- [x] `revalidatePath` でページを再検証する
- [x] `components/EnrollButton.tsx` — 受講登録ボタン（`'use client'`）

### ローディング・エラー
- [x] `app/courses/[id]/loading.tsx` — スケルトンUI
- [x] `app/courses/[id]/error.tsx` — エラー境界（`'use client'` 必須）
- [x] `app/courses/[id]/not-found.tsx` — 404 UI
