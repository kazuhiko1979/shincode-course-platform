'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { uuidSchema } from '@/lib/schemas'

export type ProgressResult = { success: true } | { error: string }

/**
 * 動画を視聴完了として記録する。video_progress に UPSERT する。
 * （user_id + video_id の複合ユニークで重複を防止）
 */
export async function markVideoCompleted(
  videoId: string,
  courseId: string
): Promise<ProgressResult> {
  const videoIdResult = uuidSchema.safeParse(videoId)
  const courseIdResult = uuidSchema.safeParse(courseId)
  if (!videoIdResult.success || !courseIdResult.success) {
    return { error: '不正な ID です' }
  }

  const supabase = await createClient()

  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return { error: 'ログインが必要です' }
  }

  const { error } = await supabase
    .from('video_progress')
    .upsert(
      { user_id: userId, video_id: videoIdResult.data },
      { onConflict: 'user_id,video_id', ignoreDuplicates: true }
    )

  if (error) {
    return { error: '視聴完了の記録に失敗しました' }
  }

  revalidatePath(`/courses/${courseIdResult.data}/videos/${videoIdResult.data}`)
  return { success: true }
}

/**
 * 視聴完了の記録を取り消す（video_progress から DELETE）。
 */
export async function unmarkVideoCompleted(
  videoId: string,
  courseId: string
): Promise<ProgressResult> {
  const videoIdResult = uuidSchema.safeParse(videoId)
  const courseIdResult = uuidSchema.safeParse(courseId)
  if (!videoIdResult.success || !courseIdResult.success) {
    return { error: '不正な ID です' }
  }

  const supabase = await createClient()

  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return { error: 'ログインが必要です' }
  }

  const { error } = await supabase
    .from('video_progress')
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoIdResult.data)

  if (error) {
    return { error: '視聴状態の更新に失敗しました' }
  }

  revalidatePath(`/courses/${courseIdResult.data}/videos/${videoIdResult.data}`)
  return { success: true }
}
