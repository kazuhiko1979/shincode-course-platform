'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin } from '@/lib/auth'
import { uuidSchema, roleSchema } from '@/lib/schemas'

/**
 * 指定ユーザーの role を変更する（user ⇔ admin）。
 * 入力（UUID / role）を検証し、実権限の検証・最後の admin 降格防止は
 * SECURITY DEFINER 関数 `admin_set_role` 側で行う。
 */
export async function setUserRole(
  targetId: string,
  newRole: 'user' | 'admin'
): Promise<{ error?: string }> {
  if (!(await isCurrentUserAdmin())) return { error: '管理者権限が必要です' }

  const idResult = uuidSchema.safeParse(targetId)
  const roleResult = roleSchema.safeParse(newRole)
  if (!idResult.success) return { error: '不正なユーザー ID です' }
  if (!roleResult.success) return { error: '不正な権限の指定です' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_set_role', {
    target_id: idResult.data,
    new_role: roleResult.data,
  })

  if (error) {
    if (error.message.includes('last admin')) {
      return { error: '最後の管理者は一般ユーザーに変更できません' }
    }
    return { error: `role の変更に失敗しました: ${error.message}` }
  }

  revalidatePath('/admin/users')
  revalidatePath('/admin')
  return {}
}
