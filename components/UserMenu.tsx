'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import RoleBadge from '@/components/admin/RoleBadge'

type Props = {
  displayName: string
  email: string
  avatarUrl?: string
  isAdmin?: boolean
}

function Avatar({
  size,
  avatarUrl,
  displayName,
}: {
  size: number
  avatarUrl?: string
  displayName: string
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={displayName}
        width={size}
        height={size}
        className="rounded-full ring-1 ring-[#d1d7dc]"
      />
    )
  }
  return (
    <div
      className="rounded-full bg-[#1c1d1f] flex items-center justify-center font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {displayName?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

export default function UserMenu({ displayName, email, avatarUrl, isAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="block rounded-full focus:outline-none focus:ring-2 focus:ring-[#a435f0]/40"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Avatar size={40} avatarUrl={avatarUrl} displayName={displayName} />
      </button>

      {open && (
        <div className="absolute right-0 top-full w-72 bg-white border border-[#d1d7dc] shadow-[0_2px_16px_rgba(0,0,0,0.16)] z-50">
          {/* ユーザー情報ヘッダー */}
          <Link
            href="/mypage"
            className="flex items-center gap-3 px-4 py-4 hover:bg-[#f7f9fa] border-b border-[#d1d7dc]"
          >
            <Avatar size={48} avatarUrl={avatarUrl} displayName={displayName} />
            <div className="min-w-0">
              <p className="font-bold text-[#1c1d1f] truncate">{displayName}</p>
              <p className="text-xs text-[#6a6f73] truncate">{email}</p>
            </div>
          </Link>

          {/* 管理者専用：管理ダッシュボードへの導線 */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-4 py-3 border-b border-[#d1d7dc] bg-[#f7f3ff] hover:bg-[#efe6ff] text-[#5022c3] font-bold"
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0L1.61 6v12L12 24l10.39-6V6L12 0zm-1.5 16.5v-9l7.79 4.5-7.79 4.5z" />
              </svg>
              管理者ダッシュボード
            </Link>
          )}

          {/* メニュー */}
          <nav className="py-1.5 text-sm text-[#1c1d1f]">
            <Link href="/mypage/courses" className="block px-4 py-2.5 hover:bg-[#f7f9fa] hover:text-[#5022c3]">
              受講中のコース
            </Link>
            <Link href="/mypage" className="block px-4 py-2.5 hover:bg-[#f7f9fa] hover:text-[#5022c3]">
              マイページ
            </Link>
          </nav>

          <div className="border-t border-[#d1d7dc] py-1.5">
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full text-left px-4 py-2.5 text-sm text-[#1c1d1f] hover:bg-[#f7f9fa] hover:text-[#5022c3]"
              >
                ログアウト
              </button>
            </form>
          </div>

          {/* 下部：現在の権限表示 */}
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-[#d1d7dc] bg-[#f7f9fa]">
            <span className="text-xs text-[#6a6f73]">アカウント種別</span>
            <RoleBadge role={isAdmin ? 'admin' : 'user'} size="sm" />
          </div>
        </div>
      )}
    </div>
  )
}
