import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * リクエスト内で一度だけ JWT 署名検証してクレームを返す。
 * React の `cache()` で同一リクエスト内の複数呼び出し（layout + page + AuthButton 等）を
 * 1 回にデデュープする。`getUser()` と違い Auth サーバへの往復は発生しない。
 */
export const getRequestClaims = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims ?? null
})

/** 現在のユーザーが管理者か。リクエスト内で role 照会を 1 回にデデュープする。 */
export const isCurrentUserAdmin = cache(async (): Promise<boolean> => {
  const claims = await getRequestClaims()
  if (!claims?.sub) return false
  const supabase = await createClient()
  return isAdminById(supabase, claims.sub)
})

/**
 * 管理者判定の単一の源。`public.users.role = 'admin'` のユーザーのみ管理者。
 * 全ユーザーはサインアップ時に role='user' で作られ、admin への昇格は
 * Supabase 上で role を手動変更することで行う（user ⇔ admin）。
 *
 * RLS（本人のみ参照）により、渡す supabase クライアントで認証中のユーザー自身の
 * role しか照会できない点に注意。自分が管理者かどうかの判定に使う。
 */
export async function isAdminById(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  return data?.role === 'admin'
}

/**
 * オープンリダイレクト対策。`next` がサイト内の安全な相対パスのときだけ返す。
 * - `/` 始まりの相対パスのみ許可
 * - `//`（プロトコル相対）・バックスラッシュ・絶対 URL・制御文字/空白は拒否
 * 安全でなければ fallback を返す。
 */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback: string | null = null
): string | null {
  if (!next) return fallback
  if (!next.startsWith('/')) return fallback
  if (next.startsWith('//')) return fallback
  if (next.includes('\\')) return fallback
  // 制御文字・空白を含むものは拒否
  if (/[\x00-\x20]/.test(next)) return fallback
  return next
}

/**
 * ログイン後のロール別デフォルト遷移先を返す。
 * admin → /admin、それ以外（一般）→ /mypage。
 * 管理者判定は `public.users.role` を照会して行う。
 */
export async function defaultPathForCurrentUser(): Promise<string> {
  const claims = await getRequestClaims()
  if (!claims?.sub) return '/auth/login'

  return (await isCurrentUserAdmin()) ? '/admin' : '/mypage'
}
