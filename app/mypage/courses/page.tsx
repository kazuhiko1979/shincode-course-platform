import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getRequestClaims } from '@/lib/auth'
import { getEnrollments } from '@/lib/enrollments'
import { getCourseProgress } from '@/lib/video_progress'
import ProgressBar from '@/components/ProgressBar'

export const metadata: Metadata = {
  title: '受講中のコース | ShinCode Courses',
}

export default async function MyCoursesPage() {
  const claims = await getRequestClaims()
  // layout で認証済みだが型を絞るためのガード
  if (!claims?.sub) return null
  const userId = claims.sub

  const enrollments = await getEnrollments(userId)

  const courses = await Promise.all(
    enrollments.map(async (course) => ({
      course,
      progress: await getCourseProgress(userId, course.id),
    }))
  )

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center border border-dashed border-[#d1d7dc] rounded-lg py-20 px-6">
        <svg className="w-14 h-14 text-[#d1d7dc] mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
        <h2 className="text-lg font-bold text-[#1c1d1f]">受講中のコースはありません</h2>
        <p className="text-sm text-[#6a6f73] mt-1">
          気になるコースを見つけて受講登録すると、ここに表示されます。
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-3 text-sm font-bold text-white bg-[#a435f0] rounded hover:bg-[#8710d8] transition-colors"
        >
          コースを探す
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map(({ course, progress }) => (
        <Link
          key={course.id}
          href={`/mypage/courses/${course.id}`}
          className="group border border-[#d1d7dc] rounded-lg overflow-hidden hover:shadow-[0_2px_12px_rgba(0,0,0,0.1)] transition-shadow flex flex-col"
        >
          <div className="relative aspect-video bg-[#f7f9fa]">
            {course.thumbnail_url ? (
              <Image
                src={course.thumbnail_url}
                alt={course.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600">
                <svg className="w-12 h-12 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </div>

          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-bold text-[15px] text-[#1c1d1f] leading-snug line-clamp-2 group-hover:text-[#5022c3]">
              {course.title}
            </h3>
            <div className="mt-auto pt-4">
              <ProgressBar completed={progress.completed} total={progress.total} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
