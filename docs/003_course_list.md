# 003 コース一覧ページ（トップページ）

## 概要
`/` — 公開コース一覧を表示するトップページ。認証不要でゲストも閲覧可能。

---

## Todo

### データ取得
- [x] `lib/courses.ts` に `getCourses()` 関数を実装する（Supabase Server client 使用）
- [x] `order` カラムで昇順ソートする
- [x] 型定義を `types/course.ts` に作成する（`Course` 型）

### ページ実装
- [x] `app/page.tsx` を Server Component として実装する
- [x] コース一覧をグリッドレイアウトで表示する
- [x] 各コースカードに：サムネイル（`next/image`）、タイトル、説明（truncate）、`/courses/[id]` へのリンク（`<Link>`）
- [x] コースが0件の場合の空状態UIを表示する

### UI コンポーネント
- [x] `components/CourseCard.tsx` — コースカードコンポーネント
- [x] `components/Header.tsx` — サイト共通ヘッダー（ロゴ + AuthButton）
- [x] `app/layout.tsx` にヘッダーを組み込む

### ローディング・エラー
- [x] `app/loading.tsx` — スケルトンUIを表示する
- [x] `app/error.tsx` — エラー境界（`'use client'` 必須）
