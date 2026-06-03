# 014 公開ページの use cache 化（#1/#5）＋ コース検索

> ⚠️ **検索 UX は [015](./015_udemy_like_search.md) で Udemy 風に刷新済み**：トップの `/?q=` ではなく専用 `/search` ページ＋ヘッダーのオートサジェストに変更。`use cache`/Suspense（#1/#5）の部分は引き続き有効。

## 概要
改善ランキングの本丸 **#1（`use cache` キャッシュ化）** と **#5（Suspense ストリーミング）** を実装し、続けて **コース検索機能**を追加した。

**設計方針（ベストプラクティス）**
- `cacheComponents: true` を有効化。公開データ（`courses`/`videos`、RLS で全員参照可）は `'use cache'` でキャッシュし、ユーザー依存部分のみ動的にストリームする。
- `'use cache'` は `cookies()` 不可 → **cookie-free クライアント**で公開データを取得（匿名で読めるため安全にキャッシュ可能）。
- 無効化は管理アクション（Server Action）で **`updateTag`**（read-your-own-writes）。`revalidateTag` は本バージョンで2引数化されたため Server Action では `updateTag` を使用。
- 検索結果は `searchParams` 依存（動的）なので `<Suspense>` 内で取得し、トップの静的シェル（ヒーロー/CTA）は即時表示。

---

## Todo

### #1 use cache（公開データのキャッシュ）
- [x] `lib/supabase/public.ts`：cookie-free 匿名クライアント
- [x] `lib/courses.ts`：`getCourses`/`getCourse` を `'use cache'` + `cacheLife('days')` + `cacheTag`
- [x] `lib/videos.ts`：`getVideos`/`getVideo` を同様に
- [x] `next.config.ts`：`cacheComponents: true`
- [x] 管理アクションに `updateTag`（courses/videos の作成・更新・削除、コース削除時は CASCADE 分の videos も）

### #5 Suspense ストリーミング
- [x] `Header`：`AuthButton`・`SearchBar` を `<Suspense>` でラップ（cookies / useSearchParams を読むため）
- [x] コース詳細：受講状態を `EnrollSection`（動的）に分離し `<Suspense>` 化。コース情報（キャッシュ済み）は即表示

### コース検索
- [x] `lib/courses.ts`：`searchCourses(q)` を `ilike`（title/description の OR 部分一致）で実装。`'use cache'` でクエリ語ごとにキャッシュ。`%`/`_`/`\` をエスケープ
- [x] `components/SearchBar.tsx`：client。`/?q=` へ SPA 遷移、現在の検索語を初期表示
- [x] トップページ：`?q=` があれば `searchCourses`、無ければ `getCourses`。`CourseResults` を `<Suspense>` 内で実行、`CourseGridSkeleton` をフォールバックに

### 確認
- [x] `npm run build`：全ルートが ◐ Partial Prerender、`getCourses` 系は `use cache`（Revalidate 1d）
- [x] `npm run lint` 通過
- [x] 稼働サーバで検索を確認（`?q=Next`→該当コース表示、`?q=該当なし`→「見つかりません」、`q` 無し→注目のコース）

---

## 注意・残課題
- 検索は `ilike`（前後ワイルドカード）で全文インデックス未使用。件数増時は `pg_trgm` GIN インデックスや `tsvector` 全文検索を検討。
- `unstable_instant`（instant nav の検証）は未導入。導入すると全エントリポイントで Suspense 配置を検証できるが、`/mypage`・`/admin` など cookie 依存レイアウトは `unstable_instant = false` での明示的な opt-out が必要になる。
- 動画視聴ページ（`/courses/[id]/videos/[videoId]`）は視聴済み状態がリストに密に絡むため、`EnrollSection` 相当の分離は未実施（ビルドは ◐ で成立）。必要なら別途リファクタ。
- perf ベンチ（`scripts/perf-bench.mjs`）は Next を介さず Supabase を直接叩くため、`use cache` のキャッシュヒット効果は計測対象外（DB 単価の前後比較用）。
