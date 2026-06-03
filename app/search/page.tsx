import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { searchCourses, type CourseSortKey } from '@/lib/courses'
import { searchQuerySchema } from '@/lib/schemas'
import CourseCard from '@/components/CourseCard'

export const metadata: Metadata = {
  title: 'コース検索 | ShinCode Courses',
}

type SearchParams = Promise<{ q?: string; sort?: string }>

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </section>
  )
}

const SORTS: { key: CourseSortKey; label: string }[] = [
  { key: 'relevance', label: '関連度順' },
  { key: 'newest', label: '新着順' },
]

async function SearchResults({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const parsedQuery = searchQuerySchema.safeParse(sp.q ?? '')
  const query = parsedQuery.success ? parsedQuery.data : ''
  const sort: CourseSortKey = sp.sort === 'newest' ? 'newest' : 'relevance'

  if (!query) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-bold text-[#1c1d1f]">検索キーワードを入力してください</h1>
        <p className="text-sm text-[#6a6f73] mt-2">ヘッダーの検索バーから学びたいことを検索できます。</p>
        <Link href="/" className="inline-block mt-6 text-sm font-bold text-[#5022c3] hover:underline">
          ← コース一覧へ戻る
        </Link>
      </div>
    )
  }

  const courses = await searchCourses(query, sort)

  return (
    <div>
      {/* 件数 + 並び替え */}
      <div className="flex items-end justify-between gap-4 flex-wrap border-b border-[#d1d7dc] pb-5 mb-6">
        <h1 className="text-2xl font-bold text-[#1c1d1f]">
          「{query}」の検索結果
          <span className="ml-2 text-base font-medium text-[#6a6f73]">{courses.length} 件</span>
        </h1>
        {courses.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-[#6a6f73]">並び替え:</span>
            {SORTS.map((s) => {
              const active = s.key === sort
              const href =
                s.key === 'relevance'
                  ? `/search?q=${encodeURIComponent(query)}`
                  : `/search?q=${encodeURIComponent(query)}&sort=${s.key}`
              return (
                <Link
                  key={s.key}
                  href={href}
                  aria-current={active ? 'true' : undefined}
                  className={`px-3 py-1.5 rounded border transition-colors ${
                    active
                      ? 'border-[#1c1d1f] font-bold text-[#1c1d1f]'
                      : 'border-[#d1d7dc] text-[#5022c3] hover:bg-[#f7f9fa]'
                  }`}
                >
                  {s.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center border border-dashed border-[#d1d7dc] rounded-lg py-20 px-6">
          <svg className="w-14 h-14 text-[#d1d7dc] mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <h2 className="text-lg font-bold text-[#1c1d1f]">「{query}」に一致するコースはありません</h2>
          <p className="text-sm text-[#6a6f73] mt-1">別のキーワードでお試しください。</p>
          <Link href="/" className="mt-6 px-6 py-3 text-sm font-bold text-white bg-[#a435f0] rounded hover:bg-[#8710d8] transition-colors">
            すべてのコースを見る
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div>
      <div className="h-8 w-64 bg-[#f0f1f3] rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col">
            <div className="aspect-video bg-[#f0f1f3] rounded animate-pulse" />
            <div className="mt-2.5 h-4 bg-[#f0f1f3] rounded animate-pulse" />
            <div className="mt-2 h-3 w-2/3 bg-[#f0f1f3] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
