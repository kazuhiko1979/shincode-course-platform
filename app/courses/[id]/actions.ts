'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { uuidSchema } from '@/lib/schemas'

export type EnrollResult = { success: true } | { error: string }

/**
 * ログイン済みユーザーを指定コースに受講登録する。
 * 既に登録済み（unique 違反）の場合も成功扱いとする。
 */
export async function enrollCourse(courseId: string): Promise<EnrollResult> {
  const idResult = uuidSchema.safeParse(courseId)
  if (!idResult.success) return { error: '不正なコース ID です' }

  const supabase = await createClient()

  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return { error: 'ログインが必要です' }
  }

  const { error } = await supabase
    .from('enrollments')
    .insert({ user_id: userId, course_id: idResult.data })

  // 23505 = unique_violation（既に受講登録済み）→ 成功扱い
  if (error && error.code !== '23505') {
    return { error: '受講登録に失敗しました' }
  }

  revalidatePath(`/courses/${idResult.data}`)
  return { success: true }
}
