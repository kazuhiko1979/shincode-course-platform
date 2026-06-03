# パフォーマンス計測（改善 2 / 3 / 4 の前後比較）

改善前後を**同じ土俵**で比較するためのベースライン。対象は [008 直後の改善ランキング](../) の：

- **#2** リクエスト内の重複クエリ排除（React `cache()`）
- **#3** `getUser()` → `getClaims()`（Auth サーバ往復の削減）
- **#4** `videos.course_id` インデックス追加

## 計測方法

```bash
# 改善前（baseline）
node --env-file=.env.local scripts/perf-bench.mjs --label before

# 改善実装後
node --env-file=.env.local scripts/perf-bench.mjs --label after

# 差分を表示
node --env-file=.env.local scripts/perf-bench.mjs --compare
```

- `scripts/perf-bench.mjs` … アプリの `lib/*` と同等のクエリを N=40 回（warmup 5）実行し median/p95 を記録。結果は `docs/perf/bench-<label>.json` に保存。
- **#4 の DB 側**は件数に依存するため、別途 `EXPLAIN (ANALYZE, BUFFERS)` でスキャン方式と実行時間を記録（下記）。

### 計測上の注意（重要）
- 絶対値は **開発マシン → Supabase（ap-northeast-1）のネットワーク遅延に支配**される。重要なのは絶対 ms ではなく **「削減できる往復数 = delta」**。これは環境が変わっても再現する信号。
- **#3** は本来 `getUser()`（認証済みリクエストで Auth サーバへ 1 往復）vs `getClaims()`（ローカル JWT 検証＝往復ゼロ）の差。実セッション生成に Google OAuth（対話）が要るため、ここでは **GoTrue への 1 往復時間を proxy 指標**として計測している（= `getUser` が毎回払い、`getClaims` が払わない分）。

---

## ベースライン（label: `before`）

REST エンドツーエンド（median ms、N=40、対象コース動画数 4）:

| metric | median | p95 | min | 意味 |
|---|---|---|---|---|
| `ref_single_roundtrip` | 219.7 | 330.1 | 183.9 | 最小 REST 往復（基準・count付き） |
| `#4_getVideos_by_course` | 79.1 | 101.2 | 52.9 | コースの動画取得（現状 Seq Scan） |
| `#2_getCourse_x1` | 81.2 | 150.4 | 46.4 | コース取得 1 回（cache 適用後の相当） |
| `#2_getCourse_x2_sequential` | 165.8 | 426.4 | 115.5 | コース取得 2 回（現状: metadata + 本体） |
| `#3_gotrue_roundtrip` | 69.8 | 108.0 | 46.7 | Auth サーバへの 1 往復（getUser 相当） |

**派生指標（改善で削減が期待できる分）:**
- **#2 重複クエリの無駄**: `x2 - x1` median = **約 84.7 ms / コース詳細1表示**（`cache()` で 0 に）
- **#3 Auth 往復**: median = **約 69.8 ms / 認証済みリクエスト**（`getClaims()` で実質 0 に）

### #4 EXPLAIN (ANALYZE) ベースライン

クエリ: `videos where course_id = … order by "order"`（動画 16 行・該当 4 行）

| 項目 | before（インデックス無し） | after（`(course_id, "order")` 追加後の想定） |
|---|---|---|
| スキャン方式 | **Seq Scan** | Index Scan |
| Rows Removed by Filter | **12**（全16行走査） | 0 |
| Sort ノード | あり（quicksort） | 不要（インデックス順） |
| Execution Time | 0.128 ms | 〜同等以下（件数増で差が拡大） |

> 現在の 16 行では DB 実行時間は誤差レベル。効果は**件数に比例**して現れる（Seq Scan は O(n)、Index Scan は O(log n)）。本番でコース/動画が増えるほど差が開く、スケール対策としての位置づけ。

---

## 結果（after）

> ⚠️ **読み方**: このベンチは「各操作の**単価**（1 往復あたりの ms）」を測る。`--compare` で同じ行が前後ほぼ同値なのは当然（同じ操作を測っているため）。
> **本当の改善は「アプリがどの操作を、何回行うか」が変わったこと**。下記の「アプリ実挙動の前後」が成果。

### アプリ実挙動の前後（1 ページ表示あたりに削減した往復）

| 改善 | before のアプリ挙動 | after のアプリ挙動 | 削減（median） |
|---|---|---|---|
| **#2** 重複 getCourse 排除（`cache()`） | コース詳細で `getCourse` ×2（`generateMetadata`＋本体）＝ **165.8ms** | `getCourse` ×1（デデュープ）＝ **74.6ms** | **約 76〜91ms / コース詳細表示** |
| **#3** `getUser`→`getClaims` | 認証ページで Auth サーバへ 1 往復＝ **約 69ms** ＋ 各所で認証取得が重複 | ローカル JWT 検証（往復 0）＋ リクエスト内 1 回にデデュープ | **約 69ms / 認証済みリクエスト** |
| **#4** `videos(course_id,"order")` index | Seq Scan＋Sort（`Rows Removed by Filter: 12`） | Index Scan・**Sort 消滅**（件数増で自動採用） | 件数比例（現 16 行では誤差） |

**合算の目安**：認証ユーザーのコース詳細表示で **約 76ms（#2）＋ 約 69ms（#3）≒ 145ms** の往復を削減。ゲストのコース詳細でも #2 の約 76ms を削減。

### #4 EXPLAIN (ANALYZE) — after

`videos(course_id, "order")` インデックス追加後：

| 項目 | before | after（現 16 行） | after（`enable_seqscan=off` で強制＝件数増時の姿） |
|---|---|---|---|
| スキャン方式 | Seq Scan | Seq Scan（小表のため最安と判断） | **Index Scan using videos_course_id_order_idx** |
| Total Cost | 16.0 | **1.2**（見積り大幅低下） | 2.35 |
| Sort ノード | あり | あり | **なし**（インデックス順で充足） |
| Rows Removed by Filter | 12 | 12 | 0 |

> 現 16 行ではプランナが正しく Seq Scan を選ぶ（インデックス走査のオーバーヘッドが見合わない）。インデックスは有効で、**動画が増えると自動的に Index Scan に切り替わる**（O(n)→O(log n)、Sort も不要化）。スケール対策としての投資。

### 生ベンチの参考値（単価, median ms）

| metric | before | after |
|---|---|---|
| `#4_getVideos_by_course` | 79.1 | 71.1 |
| `#2_getCourse_x1` | 81.2 | 74.6 |
| `#2_getCourse_x2_sequential` | 165.8 | 150.9 |
| `#3_gotrue_roundtrip` | 69.8 | 68.7 |

（差は主にネットワークゆらぎ。`#2_getCourse_x2` が before のアプリ挙動、`#2_getCourse_x1` が after のアプリ挙動に対応する点が重要。）
