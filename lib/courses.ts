import { cacheLife, cacheTag } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import type { Course } from '@/types/course'

const COURSE_COLUMNS = 'id, title, description, thumbnail_url, order, created_at'

/**
 * 公開コース一覧を order 昇順で取得する。
 * 全ユーザー共通の公開データなので `use cache` でキャッシュする。
 * 管理画面でコースを変更すると `revalidateTag('courses')` で更新される。
 */
export async function getCourses(): Promise<Course[]> {
  'use cache'
  cacheLife('days')
  cacheTag('courses')

  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_COLUMNS)
    .order('order', { ascending: true })

  if (error) {
    throw new Error(`コース一覧の取得に失敗しました: ${error.message}`)
  }

  return data ?? []
}

export type CourseSortKey = 'relevance' | 'newest'

/**
 * ilike のワイルドカード/エスケープ対策（%, _, \ を無効化）して LIKE パターンを作る。
 * PostgREST の .or() 構文で区切り文字として解釈される ( ) , も除去する。
 */
function likePattern(q: string): string {
  const sanitized = q.replace(/[(),]/g, '')
  return `%${sanitized.replace(/[\\%_]/g, (m) => `\\${m}`)}%`
}

/**
 * タイトル・説明をキーワードで部分一致検索する。
 * sort: 'relevance'（表示順 order 昇順）/ 'newest'（新着 created_at 降順）。
 * キーワード×並び順ごとに `use cache` でキャッシュ（人気の検索語ほど高速）。
 */
export async function searchCourses(
  query: string,
  sort: CourseSortKey = 'relevance'
): Promise<Course[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('courses')

  const q = query.trim()
  if (!q) return getCourses()

  const pattern = likePattern(q)
  const supabase = createPublicClient()
  let builder = supabase
    .from('courses')
    .select(COURSE_COLUMNS)
    .or(`title.ilike.${pattern},description.ilike.${pattern}`)
  builder =
    sort === 'newest'
      ? builder.order('created_at', { ascending: false })
      : builder.order('order', { ascending: true })

  const { data, error } = await builder
  if (error) {
    throw new Error(`コース検索に失敗しました: ${error.message}`)
  }

  return data ?? []
}

export type CourseSuggestion = {
  id: string
  title: string
  thumbnail_url: string | null
}

/**
 * オートサジェスト用の軽量検索。一致するコースを最大 limit 件、最小限のカラムで返す。
 */
export async function searchCoursesLite(
  query: string,
  limit = 8
): Promise<CourseSuggestion[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('courses')

  const q = query.trim()
  if (!q) return []

  const pattern = likePattern(q)
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, thumbnail_url')
    .or(`title.ilike.${pattern},description.ilike.${pattern}`)
    .order('order', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`コース検索に失敗しました: ${error.message}`)
  }

  return data ?? []
}

/**
 * 単一コースを取得する。存在しない場合・ID が不正な場合は null を返す。
 * 公開データなので `use cache`。コース個別の変更は `revalidateTag('course-<id>')` で更新。
 */
export async function getCourse(id: string): Promise<Course | null> {
  'use cache'
  cacheLife('days')
  cacheTag('courses', `course-${id}`)

  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    // 22P02 = invalid uuid 等、不正な ID は「存在しない」として扱う
    if (error.code === '22P02') return null
    throw new Error(`コースの取得に失敗しました: ${error.message}`)
  }

  return data
}
