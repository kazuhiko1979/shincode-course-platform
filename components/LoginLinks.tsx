'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * ヘッダーのゲスト用「ログイン / 無料登録」リンク。
 * 現在のページを next に載せ、ログイン後に元のページへ戻す（Udemy 風 return-to-origin）。
 * 認証系ページ自体は next に含めない（リダイレクトループ防止）。
 */
export default function LoginLinks() {
  const pathname = usePathname()

  const includeNext = pathname && !pathname.startsWith('/auth')
  const href = includeNext
    ? `/auth/login?next=${encodeURIComponent(pathname)}`
    : '/auth/login'

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Link
        href={href}
        className="px-3 py-2.5 text-sm font-bold text-[#1c1d1f] border border-[#1c1d1f] bg-white rounded hover:bg-[#f7f9fa] transition-colors"
      >
        ログイン
      </Link>
      <Link
        href={href}
        className="px-3 py-2.5 text-sm font-bold text-white bg-[#1c1d1f] border border-[#1c1d1f] rounded hover:bg-black transition-colors"
      >
        無料登録
      </Link>
    </div>
  )
}
