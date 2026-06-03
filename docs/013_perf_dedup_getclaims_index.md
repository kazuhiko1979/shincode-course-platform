# 013 パフォーマンス改善（#2 重複クエリ排除 / #3 getClaims 統一 / #4 index）

## 概要
改善ランキングの低リスク・即効 3 項目を実装し、前後を計測した。計測ハーネスと結果は [docs/perf/](./perf/) を参照。

- **#2** React `cache()` でリクエスト内の重複クエリをデデュープ（コース詳細の `getCourse` ×2→×1 ほか、認証取得の共有）
- **#3** `getUser()`（Auth サーバ往復）→ `getClaims()`（ローカル JWT 検証）へ統一
- **#4** `videos(course_id, "order")` 複合インデックスを追加（Seq Scan+Sort → Index Scan）

**設計方針（ベストプラクティス）**
- まず**計測してから**着手（`scripts/perf-bench.mjs` + `EXPLAIN ANALYZE`）。前後を同じ土俵で比較。
- 認証・データ取得の単一の源を `cache()` でラップし、layout・page・AuthButton 間の重複呼び出しを 1 回に集約。
- 認証はサーバで `getClaims()`（CLAUDE.md 準拠、往復ゼロ）。

---

## Todo

### #2 リクエスト内デデュープ（React `cache()`）
- [x] `lib/auth.ts`：`getRequestClaims()` / `isCurrentUserAdmin()` を `cache()` で追加し、`defaultPathForCurrentUser` もこれを使用
- [x] `lib/courses.ts`：`getCourses` / `getCourse` を `cache()` 化
- [x] `lib/videos.ts`：`getVideos` / `getVideo` を `cache()` 化
- [x] `app/admin/(protected)/layout.tsx`・`components/AuthButton.tsx`：`getRequestClaims`/`isCurrentUserAdmin` に統一（layout+AuthButton で 1 回に）

### #3 getUser → getClaims
- [x] 公開・マイページの各 page / layout を `getRequestClaims()` に変更（`courses/[id]`、`courses/[id]/videos/[videoId]`、`mypage/*`）
- [x] Server Actions（`courses/[id]/actions.ts`、`videos/[videoId]/actions.ts` ×2）を `getClaims()` に変更
- [x] 残存 `getUser()` なし（コメントのみ）

### #4 インデックス
- [x] migration `add_videos_course_id_order_index`：`create index videos_course_id_order_idx on videos (course_id, "order")`
- [x] `EXPLAIN` で確認（小表のため現状は Seq Scan、`enable_seqscan=off` で Index Scan・Sort 消滅を確認）

### 計測
- [x] `scripts/perf-bench.mjs`（`--label` / `--compare`）を追加
- [x] before/after を取得（`docs/perf/bench-*.json`）、`docs/perf/README.md` に結果記載

---

## 成果（要点）
- 認証ユーザーのコース詳細表示：**約 76ms（#2）＋ 約 69ms（#3）≒ 145ms** の往復削減
- ゲストのコース詳細：**約 76ms**（#2）削減
- #4：件数増で Index Scan に自動切替（O(n)→O(log n)、Sort 不要化）するスケール対策

## 次の一手（未了）
本丸の **#1 `use cache` + #5 Suspense ストリーミング**（公開ページのキャッシュ化）。`revalidatePath` の配線は既存の admin アクションで揃っている。
