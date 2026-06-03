import Link from 'next/link'
import UserMenu from './UserMenu'
import LoginLinks from './LoginLinks'
import { getRequestClaims, isCurrentUserAdmin } from '@/lib/auth'

export default async function AuthButton() {
  const claims = await getRequestClaims()

  if (!claims) {
    return <LoginLinks />
  }

  const displayName = (claims.user_metadata?.full_name as string | undefined) ?? claims.email ?? 'ユーザー'
  const avatarUrl = claims.user_metadata?.avatar_url as string | undefined
  const isAdmin = await isCurrentUserAdmin()

  return (
    <div className="flex items-center gap-4 shrink-0">
      {/* マイラーニング */}
      <Link
        href="/mypage/courses"
        className="hidden sm:block text-sm font-medium text-[#1c1d1f] hover:text-[#5022c3] transition-colors whitespace-nowrap"
      >
        マイラーニング
      </Link>

      {/* 通知ベル */}
      <Link
        href="/mypage"
        aria-label="通知"
        className="relative hidden sm:flex items-center justify-center w-9 h-9 rounded-full text-[#1c1d1f] hover:bg-[#f7f9fa] transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
      </Link>

      {/* アバター + ドロップダウン */}
      <UserMenu displayName={displayName} email={claims.email ?? ''} avatarUrl={avatarUrl} isAdmin={isAdmin} />
    </div>
  )
}
