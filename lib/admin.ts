import { createClient } from '@/lib/supabase/server'

export type AdminUser = {
  id: string
  email: string
  role: 'user' | 'admin'
  created_at: string
  enrollment_count: number
}

export type AdminStats = {
  users_total: number
  admins_total: number
  courses_total: number
  videos_total: number
  enrollments_total: number
  completions_total: number
  top_courses: { id: string; title: string; enrollments: number }[]
  recent_signups: { email: string; role: 'user' | 'admin'; created_at: string }[]
}

/** 全ユーザーの一覧（admin のみ。SECURITY DEFINER 関数経由で email も取得）。 */
export async function listUsers(): Promise<AdminUser[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) throw new Error(`ユーザー一覧の取得に失敗しました: ${error.message}`)
  return (data ?? []) as AdminUser[]
}

/** プラットフォームの集計統計（admin のみ）。 */
export async function getAdminStats(): Promise<AdminStats | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_stats')
  if (error) throw new Error(`統計の取得に失敗しました: ${error.message}`)
  return (data ?? null) as AdminStats | null
}
