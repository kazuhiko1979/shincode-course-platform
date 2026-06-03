import { Suspense } from 'react'
import Link from 'next/link'
import AuthButton from '@/components/AuthButton'
import SearchBar from '@/components/SearchBar'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#d1d7dc] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <svg className="w-7 h-7 text-[#a435f0]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0L1.61 6v12L12 24l10.39-6V6L12 0zm-1.5 16.5v-9l7.79 4.5-7.79 4.5z" />
          </svg>
          <span className="font-bold text-xl tracking-tight text-[#1c1d1f]">
            ShinCode
          </span>
        </Link>

        {/* 検索バー（Udemy風） */}
        <div className="hidden md:flex flex-1 max-w-2xl">
          <Suspense
            fallback={
              <div className="w-full h-11 rounded-full border border-[#d1d7dc] bg-[#f7f9fa]" />
            }
          >
            <SearchBar />
          </Suspense>
        </div>

        <Suspense fallback={<div className="w-10 h-10 rounded-full bg-[#f0f1f3] animate-pulse shrink-0" />}>
          <AuthButton />
        </Suspense>
      </div>
    </header>
  )
}
