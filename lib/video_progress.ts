import { createClient } from '@/lib/supabase/server'

/**
 * 指定動画をユーザーが視聴完了済みかを返す。
 * video_progress に行があれば完了とみなす。RLS により本人の行のみ参照可能。
 */
export async function getVideoProgress(
  userId: string,
  videoId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('video_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle()

  if (error) {
    if (error.code === '22P02') return false
    throw new Error(`視聴状態の取得に失敗しました: ${error.message}`)
  }

  return data !== null
}

/**
 * 指定した動画 ID 群のうち、ユーザーが完了済みのものの集合を返す。
 * サイドバーの完了マーク表示に使う。
 */
export async function getCompletedVideoIds(
  userId: string,
  videoIds: string[]
): Promise<Set<string>> {
  if (videoIds.length === 0) return new Set()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('video_progress')
    .select('video_id')
    .eq('user_id', userId)
    .in('video_id', videoIds)

  if (error) {
    throw new Error(`視聴状態の取得に失敗しました: ${error.message}`)
  }

  return new Set((data ?? []).map((row) => row.video_id as string))
}

export type CourseProgress = { completed: number; total: number }

/**
 * コースの進捗（完了動画数 / 全動画数）を返す。
 */
export async function getCourseProgress(
  userId: string,
  courseId: string
): Promise<CourseProgress> {
  const supabase = await createClient()

  const [totalRes, completedRes] = await Promise.all([
    supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId),
    supabase
      .from('video_progress')
      .select('video_id, videos!inner(course_id)', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('videos.course_id', courseId),
  ])

  if (totalRes.error) {
    throw new Error(`動画数の取得に失敗しました: ${totalRes.error.message}`)
  }
  if (completedRes.error) {
    throw new Error(`進捗の取得に失敗しました: ${completedRes.error.message}`)
  }

  return { completed: completedRes.count ?? 0, total: totalRes.count ?? 0 }
}
