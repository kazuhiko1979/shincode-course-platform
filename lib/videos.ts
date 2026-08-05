import { cacheLife, cacheTag } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import type { Video } from '@/types/video'

const VIDEO_COLUMNS = 'id, course_id, title, description, youtube_url, order, created_at'

/**
 * 指定コースの動画一覧を order 昇順で取得する。
 * 公開データなので `use cache`。管理画面での変更は `updateTag('videos'|'videos-<courseId>')` で更新。
 */
export async function getVideos(courseId: string): Promise<Video[]> {
  'use cache'
  cacheLife('days')
  cacheTag('videos', `videos-${courseId}`)

  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('videos')
    .select(VIDEO_COLUMNS)
    .eq('course_id', courseId)
    .order('order', { ascending: true })

  if (error) {
    // 22P02 = invalid uuid 等は空配列として扱う
    if (error.code === '22P02') return []
    throw new Error(`動画一覧の取得に失敗しました: ${error.message}`)
  }

  return data ?? []
}

/**
 * 単一動画を取得する。存在しない場合・ID が不正な場合は null を返す。
 * 公開データなので `use cache`。
 */
export async function getVideo(videoId: string): Promise<Video | null> {
  'use cache'
  cacheLife('days')
  cacheTag('videos', `video-${videoId}`)

  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('videos')
    .select(VIDEO_COLUMNS)
    .eq('id', videoId)
    .maybeSingle()

  if (error) {
    if (error.code === '22P02') return null
    throw new Error(`動画の取得に失敗しました: ${error.message}`)
  }

  return data
}
