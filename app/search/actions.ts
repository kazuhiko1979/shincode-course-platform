'use server'

import { searchCoursesLite, type CourseSuggestion } from '@/lib/courses'
import { searchQuerySchema } from '@/lib/schemas'

/**
 * オートサジェスト用のコース候補を返す（クライアントの検索バーから呼ぶ）。
 * 最小 2 文字から。内部データ取得を API ルートに出さず Server Action で行う（プロジェクト規約）。
 */
export async function suggestCourses(query: string): Promise<CourseSuggestion[]> {
  const parsed = searchQuerySchema.safeParse(query)
  if (!parsed.success) return []
  const q = parsed.data
  if (q.length < 2) return []
  return searchCoursesLite(q, 8)
}
