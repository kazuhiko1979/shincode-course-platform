# 015 Udemy 風コース検索（オートサジェスト＋専用結果ページ）

## 概要
[014](./014_use_cache_and_search.md) の簡易検索（トップ `/?q=`）を、Udemy のベストプラクティスに沿った検索体験に刷新した。

**Udemy 風のポイント（調査に基づく）**
- ヘッダーの**オートサジェスト ドロップダウン**：入力中に候補を表示
- **専用の検索結果ページ**（件数表示＋並び替え）
- 候補クリックでそのコースへ、Enter / 虫眼鏡で結果ページへ

**オートサジェストのベストプラクティス（適用）**
- 最小 2 文字から／入力を 200ms デバウンス／候補は最大 8 件・スクロールなし（Hick's law）
- キーボード操作（↑↓ / Enter / Esc）／一致部分のハイライト／該当なし表示
- ARIA combobox パターン（`role=combobox` + `aria-expanded`/`aria-controls`/`aria-activedescendant`、`role=listbox`/`option`）
- 内部データ取得は API ルートではなく **Server Action**（プロジェクト規約）

参考: [UX Magazine: Designing autosuggest experiences](https://uxmag.com/articles/best-practices-designing-autosuggest-experiences)

---

## Todo

- [x] `lib/courses.ts`：`searchCourses(q, sort)` に並び替え（relevance=order / newest=created_at desc）を追加。`searchCoursesLite(q, limit)` と `CourseSuggestion` 型を追加（いずれも `use cache`）
- [x] `app/search/actions.ts`：`'use server'` `suggestCourses(q)`（最小2文字、最大8件）
- [x] `app/search/page.tsx`：専用結果ページ。件数表示＋並び替えリンク（関連度順／新着順）、空結果 UI。`Suspense`＋スケルトン（`searchParams` 依存のため）
- [x] `components/SearchBar.tsx`：オートサジェスト combobox に刷新（デバウンス・キーボード操作・ハイライト・ARIA・`/search?q=` へ SPA 遷移・候補クリックで `/courses/[id]`）
- [x] `app/page.tsx`：トップの `?q=` 処理を撤去し `FeaturedCourses`（キャッシュ済み一覧）に戻す
- [x] `CLAUDE.md`：ルート構成を更新（`/search` 追加、`/` から `?q=` 撤去）

## 確認
- [x] `npm run build`（全ルート ◐ PPR、`/search` 追加、`/` は 1d キャッシュに復帰）／`npm run lint` 通過
- [x] 稼働サーバ実測：`/search?q=Next`→該当コース＋並び替え表示、`?sort=newest`→新着順、`?q=該当なし`→「一致するコースはありません」、`q` 無し→入力促し

## 残課題
- オートサジェストのドロップダウン挙動はクライアント JS のため、E2E（Playwright 等）での検証は未実施（ビルド/lint と結果ページの実測のみ）。
- 検索は `ilike`（前後ワイルドカード）。件数増時は `pg_trgm` GIN もしくは `tsvector` 全文検索、表記ゆれ・ローマ字/かな対応を検討。
- フィルタ（レベル・価格・評価等）は MVP のデータモデルに該当項目がないため未実装。並び替え（関連度／新着）のみ提供。
- 最近の検索履歴（Udemy のゼロ状態表示）は未実装。
