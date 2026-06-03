'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { courseFormSchema, uuidSchema, formString, firstError } from '@/lib/schemas'

export type CourseFormState = { error?: string }

/** FormData からコース入力を検証する。 */
function parseCourseForm(formData: FormData) {
  return courseFormSchema.safeParse({
    title: formString(formData, 'title'),
    description: formString(formData, 'description'),
    thumbnail_url: formString(formData, 'thumbnail_url'),
    order: formString(formData, 'order'),
  })
}

function revalidateCoursePaths(courseId?: string) {
  // use cache（getCourses/getCourse）の無効化（Server Action なので read-your-own-writes の updateTag）
  updateTag('courses')
  if (courseId) updateTag(`course-${courseId}`)
  // 念のためパスも更新
  revalidatePath('/')
  revalidatePath('/courses')
  revalidatePath('/admin/courses')
  if (courseId) revalidatePath(`/courses/${courseId}`)
}

/** コースを新規作成する。成功時は一覧へリダイレクト。 */
export async function createCourse(
  _prev: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  const parsed = parseCourseForm(formData)
  if (!parsed.success) return { error: firstError(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.from('courses').insert(parsed.data)

  if (error) return { error: `作成に失敗しました: ${error.message}` }

  revalidateCoursePaths()
  redirect('/admin/courses')
}

/** 既存コースを更新する。成功時は一覧へリダイレクト。 */
export async function updateCourse(
  _prev: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  const idResult = uuidSchema.safeParse(formString(formData, 'id'))
  if (!idResult.success) return { error: 'コース ID が指定されていません' }

  const parsed = parseCourseForm(formData)
  if (!parsed.success) return { error: firstError(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.from('courses').update(parsed.data).eq('id', idResult.data)

  if (error) return { error: `更新に失敗しました: ${error.message}` }

  revalidateCoursePaths(idResult.data)
  redirect('/admin/courses')
}

/**
 * コースを削除する。関連する videos / enrollments / video_progress は
 * FK の ON DELETE CASCADE により自動削除される。
 */
export async function deleteCourse(courseId: string): Promise<{ error?: string }> {
  const idResult = uuidSchema.safeParse(courseId)
  if (!idResult.success) return { error: '不正なコース ID です' }

  const supabase = await createClient()
  const { error } = await supabase.from('courses').delete().eq('id', idResult.data)

  if (error) return { error: `削除に失敗しました: ${error.message}` }

  // 動画も FK CASCADE で削除されるため videos キャッシュも無効化
  updateTag('videos')
  revalidateCoursePaths(idResult.data)
  return {}
}
