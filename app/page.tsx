import { Suspense } from 'react'
import Link from 'next/link'
import { getCourses } from '@/lib/courses'
import CourseCard from '@/components/CourseCard'

export default async function Home() {
  return (
    <div className="bg-white">
      {/* ヒーローバナー（Udemy風プロモカード） */}
      <section className="relative bg-[#f7f9fa] border-b border-[#d1d7dc] overflow-hidden">
        <div
          className="absolute inset-0 opacity-100"
          style={{
            background:
              'radial-gradient(circle at 75% 30%, rgba(164,53,240,0.10), transparent 45%), radial-gradient(circle at 90% 80%, rgba(99,102,241,0.10), transparent 40%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-16 sm:py-24">
          <div className="max-w-xl bg-white border border-[#d1d7dc] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.08)] animate-fade-up">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1c1d1f] leading-tight mb-3">
              スキルが、未来をつくる。
            </h1>
            <p className="text-base text-[#6a6f73] leading-relaxed">
              現役エンジニアによる実践的な動画講座で、コーディングスキルを次のレベルへ。
              いつでも、どこでも、自分のペースで学べます。
            </p>
            <Link
              href="/auth/login"
              className="inline-block mt-6 px-6 py-3 text-sm font-bold text-white bg-[#a435f0] rounded hover:bg-[#8710d8] transition-colors"
            >
              無料で学習を始める
            </Link>
          </div>
        </div>
      </section>

      {/* コースセクション（キャッシュ済みデータをストリーム） */}
      <section id="courses" className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-[#1c1d1f] mb-1">注目のコース</h2>
        <p className="text-[#6a6f73] mb-8">人気の講座をチェックしよう</p>
        <Suspense fallback={<CourseGridSkeleton />}>
          <FeaturedCourses />
        </Suspense>
      </section>

      {/* 学習を促すバンド */}
      <section className="bg-[#f7f9fa] border-t border-[#d1d7dc]">
        <div className="max-w-7xl mx-auto px-6 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1c1d1f]">今すぐ学習を始めよう</h2>
            <p className="text-[#6a6f73] mt-1">Googleアカウントで簡単サインイン。受講も進捗管理も無料です。</p>
          </div>
          <Link
            href="/auth/login"
            className="shrink-0 px-6 py-3 text-sm font-bold text-white bg-[#a435f0] rounded hover:bg-[#8710d8] transition-colors"
          >
            無料で始める
          </Link>
        </div>
      </section>
    </div>
  )
}

/** 注目コースの一覧（キャッシュ済み getCourses）。 */
async function FeaturedCourses() {
  const courses = await getCourses()

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center border border-dashed border-[#d1d7dc] rounded-lg py-20 px-6">
        <svg className="w-14 h-14 text-[#d1d7dc] mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
        <h3 className="text-lg font-bold text-[#1c1d1f]">まだコースがありません</h3>
        <p className="text-sm text-[#6a6f73] mt-1">
          公開されているコースが追加されると、ここに表示されます。
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}

/** 一覧取得中のスケルトン。 */
function CourseGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="aspect-video bg-[#f0f1f3] rounded animate-pulse" />
          <div className="mt-2.5 h-4 bg-[#f0f1f3] rounded animate-pulse" />
          <div className="mt-2 h-3 w-2/3 bg-[#f0f1f3] rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}
