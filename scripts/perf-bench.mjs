// パフォーマンス計測ハーネス（改善 2/3/4 の前後比較用）
//
// 使い方:
//   node --env-file=.env.local scripts/perf-bench.mjs            # 計測してコンソール表示＋JSON保存
//   node --env-file=.env.local scripts/perf-bench.mjs --label after
//
// 計測対象:
//   #2 重複クエリ排除  : getCourse ×1（cache後相当）と ×2 連続（現状: generateMetadata + 本体）
//   #3 getUser→getClaims: GoTrue(Auth サーバ)への 1 往復コスト（getUser が毎回払う / getClaims は払わない）
//   #4 videos index    : videos を course_id で取得（+order ソート）のエンドツーエンド REST 往復
//   ref 単一往復       : PostgREST への最小往復（基準値）
//
// 注: ネットワークのゆらぎを吸収するため N 回計測し median/p95 を採用。

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

// --compare: before/after の JSON を読んで差分を表示して終了
if (process.argv.includes('--compare')) {
  const before = JSON.parse(readFileSync('docs/perf/bench-before.json', 'utf8'))
  const after = JSON.parse(readFileSync('docs/perf/bench-after.json', 'utf8'))
  const rows = Object.keys(before.results).map((k) => {
    const b = before.results[k].median
    const a = after.results[k]?.median ?? null
    const delta = a == null ? null : +(a - b).toFixed(2)
    const pctChange = a == null ? null : `${(((a - b) / b) * 100).toFixed(1)}%`
    return { metric: k, 'before median(ms)': b, 'after median(ms)': a, 'delta(ms)': delta, change: pctChange }
  })
  console.log('\n=== before vs after (median ms) ===')
  console.table(rows)
  console.log(`\n#2 重複クエリ無駄: before ${before.derived.dup_query_overhead_ms_median}ms → after ${after.derived.dup_query_overhead_ms_median}ms`)
  console.log(`#3 Auth 往復: before ${before.derived.auth_roundtrip_ms_median}ms → after ${after.derived.auth_roundtrip_ms_median}ms`)
  process.exit(0)
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (!URL || !KEY) {
  console.error('環境変数が読めません。node --env-file=.env.local で実行してください。')
  process.exit(1)
}

const labelArg = process.argv.indexOf('--label')
const LABEL = labelArg !== -1 ? process.argv[labelArg + 1] : 'before'
const N = 40
const WARMUP = 5

const supabase = createClient(URL, KEY)

function pct(sorted, p) {
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[i]
}
function summarize(times) {
  const s = [...times].sort((a, b) => a - b)
  const mean = s.reduce((a, b) => a + b, 0) / s.length
  return {
    n: s.length,
    min: +s[0].toFixed(2),
    median: +pct(s, 50).toFixed(2),
    p95: +pct(s, 95).toFixed(2),
    max: +s[s.length - 1].toFixed(2),
    mean: +mean.toFixed(2),
  }
}
async function bench(fn) {
  for (let i = 0; i < WARMUP; i++) await fn()
  const times = []
  for (let i = 0; i < N; i++) {
    const t = performance.now()
    await fn()
    times.push(performance.now() - t)
  }
  return summarize(times)
}

// --- 計測対象クエリ（アプリの lib/* と同等） ---
const COURSE_COLS = 'id, title, description, thumbnail_url, order, created_at'
const VIDEO_COLS = 'id, course_id, title, description, youtube_url, order, created_at'

async function getCourse(id) {
  return supabase.from('courses').select(COURSE_COLS).eq('id', id).maybeSingle()
}
async function getVideos(courseId) {
  return supabase.from('videos').select(VIDEO_COLS).eq('course_id', courseId).order('order', { ascending: true })
}
async function refRoundTrip() {
  // 最小の PostgREST 往復（基準）
  return supabase.from('courses').select('id', { head: true, count: 'exact' }).limit(1)
}
async function gotrueRoundTrip() {
  // getUser が払う Auth サーバへの 1 往復に相当（getClaims は払わない）
  return fetch(`${URL}/auth/v1/settings`, { headers: { apikey: KEY } })
}

async function main() {
  // 動画を持つコースを探す
  const { data: courses } = await supabase.from('courses').select('id').order('order')
  let courseId = null
  let videoCount = 0
  for (const c of courses ?? []) {
    const { data: vids } = await getVideos(c.id)
    if (vids && vids.length > 0) {
      courseId = c.id
      videoCount = vids.length
      break
    }
  }
  courseId = courseId ?? courses?.[0]?.id
  if (!courseId) {
    console.error('コースが見つかりません。')
    process.exit(1)
  }

  console.log(`\n計測ラベル: ${LABEL}  (N=${N}, warmup=${WARMUP})`)
  console.log(`対象コース: ${courseId}  動画数: ${videoCount}\n`)

  const results = {}
  results.ref_single_roundtrip = await bench(() => refRoundTrip())
  results['#4_getVideos_by_course'] = await bench(() => getVideos(courseId))
  results['#2_getCourse_x1'] = await bench(() => getCourse(courseId))
  results['#2_getCourse_x2_sequential'] = await bench(async () => {
    await getCourse(courseId) // generateMetadata 相当
    await getCourse(courseId) // ページ本体相当（cache() 未適用なので 2 回叩く）
  })
  results['#3_gotrue_roundtrip'] = await bench(() => gotrueRoundTrip())

  // 表示
  const rows = Object.entries(results).map(([k, v]) => ({
    metric: k,
    'median(ms)': v.median,
    'p95(ms)': v.p95,
    'min(ms)': v.min,
    'mean(ms)': v.mean,
  }))
  console.table(rows)

  // 派生指標
  const dupOverhead = (results['#2_getCourse_x2_sequential'].median - results['#2_getCourse_x1'].median).toFixed(2)
  console.log(`\n#2 重複クエリの無駄 (x2 - x1) median: ${dupOverhead} ms  ← cache() で削減できる分`)
  console.log(`#3 getUser が払う Auth 往復 (median): ${results['#3_gotrue_roundtrip'].median} ms  ← getClaims は ~0（ローカル検証）`)

  const payload = {
    label: LABEL,
    capturedAtNote: 'タイムスタンプはファイルのmtimeを参照',
    env: { url: URL.replace(/https:\/\//, '').split('.')[0] },
    config: { N, WARMUP, courseId, videoCount },
    results,
    derived: {
      dup_query_overhead_ms_median: +dupOverhead,
      auth_roundtrip_ms_median: results['#3_gotrue_roundtrip'].median,
    },
  }
  mkdirSync('docs/perf', { recursive: true })
  const file = `docs/perf/bench-${LABEL}.json`
  writeFileSync(file, JSON.stringify(payload, null, 2))
  console.log(`\n保存: ${file}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
