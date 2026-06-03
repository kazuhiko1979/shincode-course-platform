# 005 動画視聴ページ

## 概要
`/courses/[id]/videos/[id]` — YouTube 埋め込みで動画を視聴するページ。認証不要でゲストも閲覧可能。ログイン済みユーザーは視聴完了を記録できる。

---

## Todo

### データ取得
- [x] `lib/videos.ts` に `getVideo(videoId)` 関数を実装する
- [x] 同コースの動画一覧も取得してサイドバーに表示する
- [x] `lib/video_progress.ts` に `getVideoProgress(userId, videoId)` を実装する

### ページ実装
- [x] `app/courses/[id]/videos/[id]/page.tsx` を Server Component として実装する
- [x] `params` は必ず `await` してから使う（Next.js 16）
- [x] YouTube 動画を `<iframe>` で埋め込む（`youtube_url` から動画IDを抽出）
- [x] 動画タイトル・説明を表示する
- [x] サイドバーにコース内の全動画リストを表示する（現在の動画をハイライト）
- [x] 動画が存在しない場合は `notFound()` を呼ぶ

### 視聴完了マーク
- [x] `app/courses/[id]/videos/[id]/actions.ts` に `markVideoCompleted` Server Action を実装する
- [x] `video_progress` テーブルに UPSERT する
- [x] `components/MarkCompleteButton.tsx` — 視聴完了ボタン（`'use client'`、ログイン時のみ表示）
- [x] 完了済みの場合はチェック済みUIを表示する

### ナビゲーション
- [x] 前の動画・次の動画へのリンクを表示する
- [x] コース詳細ページへの戻るリンクを表示する

### ローディング・エラー
- [x] `app/courses/[id]/videos/[id]/loading.tsx` — スケルトンUI
- [x] `app/courses/[id]/videos/[id]/error.tsx` — エラー境界（`'use client'` 必須）
- [x] `app/courses/[id]/videos/[id]/not-found.tsx` — 404 UI

### Metadata
- [x] `generateMetadata` で動画タイトルをページタイトルに設定する
