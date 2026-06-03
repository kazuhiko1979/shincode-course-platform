import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCourse } from '@/lib/courses'
import { getVideos } from '@/lib/videos'
import EnrollSection from './EnrollSection'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const course = await getCourse(id)
  if (!course) return { title: 'コースが見つかりません' }
  return {
    title: `${course.title} | ShinCode Courses`,
    description: course.description ?? undefined,
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params

  const [course, videos] = await Promise.all([getCourse(id), getVideos(id)])

  if (!course) notFound()

  return (
    <div className="bg-white">
      {/* コースヘッダー */}
      <section className="bg-[#1c1d1f] text-white">
        <div className="max-w-7xl mx-auto px-6 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-start">
          <div className="max-w-2xl">
            <nav className="text-sm text-[#cec0fc] mb-4">
              <Link href="/" className="hover:underline">
                コース一覧
              </Link>
              <span className="mx-2 text-[#6a6f73]">/</span>
              <span className="text-[#a1a1aa]">{course.title}</span>
            </nav>

            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{course.title}</h1>
            {course.description && (
              <p className="mt-4 text-[#d1d7dc] leading-relaxed whitespace-pre-wrap">
                {course.description}
              </p>
            )}

            <p className="mt-5 text-sm text-[#a1a1aa]">
              {videos.length} 本の動画
            </p>

            {/* 受講状態（ユーザー依存・Suspense でストリーム） */}
            <div className="mt-6">
              <Suspense
                fallback={
                  <span className="inline-block h-11 w-44 rounded bg-white/10 animate-pulse" />
                }
              >
                <EnrollSection courseId={course.id} />
              </Suspense>
            </div>
          </div>

          {/* サムネイル */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="relative aspect-video border border-[#3e4143] overflow-hidden bg-[#2d2f31] rounded">
              {course.thumbnail_url ? (
                <Image
                  src={course.thumbnail_url}
                  alt={course.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 320px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600">
                  <svg className="w-12 h-12 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 動画一覧 */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-[#1c1d1f] mb-5">カリキュラム</h2>

        {videos.length === 0 ? (
          <div className="border border-dashed border-[#d1d7dc] rounded-lg py-16 text-center">
            <p className="text-sm text-[#6a6f73]">このコースにはまだ動画がありません。</p>
          </div>
        ) : (
          <ul className="border border-[#d1d7dc] rounded-lg divide-y divide-[#d1d7dc] overflow-hidden">
            {videos.map((video, index) => (
              <li key={video.id}>
                <Link
                  href={`/courses/${course.id}/videos/${video.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#f7f9fa] transition-colors group"
                >
                  <span className="shrink-0 w-7 text-right text-sm font-medium text-[#6a6f73]">
                    {index + 1}
                  </span>
                  <svg className="shrink-0 w-5 h-5 text-[#a435f0]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="font-medium text-[15px] text-[#1c1d1f] truncate group-hover:text-[#5022c3]">
                      {video.title}
                    </p>
                    {video.description && (
                      <p className="text-xs text-[#6a6f73] truncate mt-0.5">{video.description}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
