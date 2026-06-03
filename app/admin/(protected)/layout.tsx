import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestClaims, isCurrentUserAdmin } from '@/lib/auth'

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // getClaims() で JWT 署名を検証（リクエスト内でデデュープ）
  const claims = await getRequestClaims()
  if (!claims) {
    redirect('/auth/login?next=/admin')
  }

  // 管理者判定は users.role を照会して行う（多層防御の二次チェック）
  if (!(await isCurrentUserAdmin())) {
    redirect('/mypage')
  }

  return (
    <div className="bg-white min-h-full">
      {/* 管理画面サブヘッダー */}
      <div className="bg-[#1c1d1f] text-white border-b border-[#3e4143]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-bold tracking-wide text-[#cec0fc] hover:text-white transition-colors">
              管理画面
            </Link>
            <Link href="/admin/courses" className="text-sm font-medium hover:text-[#cec0fc] transition-colors">
              コース管理
            </Link>
            <Link href="/admin/users" className="text-sm font-medium hover:text-[#cec0fc] transition-colors">
              ユーザー管理
            </Link>
            <Link href="/admin/stats" className="text-sm font-medium hover:text-[#cec0fc] transition-colors">
              統計・分析
            </Link>
          </div>
          <Link href="/" className="text-sm text-[#d1d7dc] hover:text-white transition-colors">
            サイトを表示 →
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">{children}</div>
    </div>
  )
}
