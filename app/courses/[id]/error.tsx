'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <div className="flex flex-col items-center justify-center text-center border border-[#d1d7dc] rounded-lg py-20 px-6">
        <svg className="w-14 h-14 text-[#a435f0] mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <h2 className="text-lg font-bold text-[#1c1d1f]">コースの読み込みに失敗しました</h2>
        <p className="text-sm text-[#6a6f73] mt-1">
          一時的な問題が発生した可能性があります。もう一度お試しください。
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={reset}
            className="px-6 py-3 text-sm font-bold text-white bg-[#a435f0] rounded hover:bg-[#8710d8] transition-colors"
          >
            再試行する
          </button>
          <Link
            href="/"
            className="px-6 py-3 text-sm font-bold text-[#1c1d1f] border border-[#1c1d1f] rounded hover:bg-[#f7f9fa] transition-colors"
          >
            コース一覧へ
          </Link>
        </div>
      </div>
    </div>
  )
}
