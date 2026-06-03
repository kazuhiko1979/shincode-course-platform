import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <div className="flex flex-col items-center justify-center text-center border border-dashed border-[#d1d7dc] rounded-lg py-20 px-6">
        <svg className="w-14 h-14 text-[#d1d7dc] mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </svg>
        <h2 className="text-lg font-bold text-[#1c1d1f]">動画が見つかりません</h2>
        <p className="text-sm text-[#6a6f73] mt-1">
          お探しの動画は削除されたか、URL が間違っている可能性があります。
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-3 text-sm font-bold text-white bg-[#a435f0] rounded hover:bg-[#8710d8] transition-colors"
        >
          コース一覧へ戻る
        </Link>
      </div>
    </div>
  )
}
