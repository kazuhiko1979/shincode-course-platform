'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { videoFormSchema, uuidSchema, formString, firstError } from '@/lib/schemas'

export type VideoFormState = { error?: string }

/** FormData から動画入力を検証する。 */
function parseVideoForm(formData: FormData) {
  return videoFormSchema.safeParse({
    title: formString(formData, 'title'),
    description: formString(formData, 'description'),
    youtube_url: formString(formData, 'youtube_url'),
    order: formString(formData, 'order'),
  })
}

function revalidateVideoPaths(courseId: string, videoId?: string) {
  // use cache（getVideos/getVideo）の無効化（Server Action なので read-your-own-writes の updateTag）
  updateTag('videos')
  updateTag(`videos-${courseId}`)
  if (videoId) updateTag(`video-${videoId}`)
  // 念のためパスも更新
  revalidatePath(`/courses/${courseId}`)
  revalidatePath(`/admin/courses/${courseId}/videos`)
  if (videoId) revalidatePath(`/courses/${courseId}/videos/${videoId}`)
}

/** 動画を新規追加する。成功時は動画一覧へリダイレクト。 */
export async function createVideo(
  _prev: VideoFormState,
  formData: FormData
): Promise<VideoFormState> {
  const courseIdResult = uuidSchema.safeParse(formString(formData, 'course_id'))
  if (!courseIdResult.success) return { error: 'コース ID が指定されていません' }
  const courseId = courseIdResult.data

  const parsed = parseVideoForm(formData)
  if (!parsed.success) return { error: firstError(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase
    .from('videos')
    .insert({ course_id: courseId, ...parsed.data })

  if (error) return { error: `追加に失敗しました: ${error.message}` }

  revalidateVideoPaths(courseId)
  redirect(`/admin/courses/${courseId}/videos`)
}

/** 既存動画を更新する。成功時は動画一覧へリダイレクト。 */
export async function updateVideo(
  _prev: VideoFormState,
  formData: FormData
): Promise<VideoFormState> {
  const courseIdResult = uuidSchema.safeParse(formString(formData, 'course_id'))
  const idResult = uuidSchema.safeParse(formString(formData, 'id'))
  if (!courseIdResult.success || !idResult.success) return { error: 'ID が指定されていません' }
  const courseId = courseIdResult.data

  const parsed = parseVideoForm(formData)
  if (!parsed.success) return { error: firstError(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.from('videos').update(parsed.data).eq('id', idResult.data)

  if (error) return { error: `更新に失敗しました: ${error.message}` }

  revalidateVideoPaths(courseId, idResult.data)
  redirect(`/admin/courses/${courseId}/videos`)
}

/**
 * 動画を削除する。関連する video_progress は FK の ON DELETE CASCADE により
 * 自動削除される（admin は RLS により他ユーザーの進捗を直接削除できないため、
 * CASCADE に委ねるのが正しい）。
 */
export async function deleteVideo(
  videoId: string,
  courseId: string
): Promise<{ error?: string }> {
  const videoIdResult = uuidSchema.safeParse(videoId)
  const courseIdResult = uuidSchema.safeParse(courseId)
  if (!videoIdResult.success || !courseIdResult.success) {
    return { error: '不正な ID です' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('videos').delete().eq('id', videoIdResult.data)

  if (error) return { error: `削除に失敗しました: ${error.message}` }

  revalidateVideoPaths(courseIdResult.data)
  return {}
}
