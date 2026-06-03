import { createClient } from '@/lib/supabase/server'
import type { Course } from '@/types/course'

export type Enrollment = {
  id: string
  user_id: string
  course_id: string
  created_at: string
}

export type EnrolledCourse = Course & { enrolled_at: string }

/**
 * ユーザーが指定コースを受講登録しているかを返す。
 * 未登録なら null。RLS により本人の行のみ参照可能。
 */
export async function getEnrollment(
  userId: string,
  courseId: string
): Promise<Enrollment | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('enrollments')
    .select('id, user_id, course_id, created_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (error) {
    if (error.code === '22P02') return null
    throw new Error(`受講状態の取得に失敗しました: ${error.message}`)
  }

  return data
}

/**
 * ユーザーの受講中コース一覧を、コース情報を JOIN して取得する。
 * 受講登録日時の新しい順。
 */
export async function getEnrollments(userId: string): Promise<EnrolledCourse[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('enrollments')
    .select(
      'created_at, courses(id, title, description, thumbnail_url, order, created_at)'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`受講中コースの取得に失敗しました: ${error.message}`)
  }

  return (data ?? [])
    .filter((row) => row.courses !== null)
    .map((row) => {
      const course = row.courses as unknown as Course
      return { ...course, enrolled_at: row.created_at as string }
    })
}
