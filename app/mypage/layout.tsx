import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestClaims } from '@/lib/auth'

export default async function MyPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const claims = await getRequestClaims()

  // 未ログインはログインページへ
  if (!claims) {
    redirect('/auth/login')
  }

  return (
    <div className="bg-white">
      {/* マイページ共通ヘッダー */}
      <div className="bg-[#1c1d1f] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold">マイラーニング</h1>
          <nav className="mt-4">
            <Link
              href="/mypage/courses"
              className="text-sm font-bold border-b-2 border-white pb-2 text-white"
            >
              受講中のコース
            </Link>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">{children}</div>
    </div>
  )
}
