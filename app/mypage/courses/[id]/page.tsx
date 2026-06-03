import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getRequestClaims } from '@/lib/auth'
import { getCourse } from '@/lib/courses'
import { getVideos } from '@/lib/videos'
import { getCompletedVideoIds } from '@/lib/video_progress'
import ProgressBar from '@/components/ProgressBar'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const course = await getCourse(id)
  if (!course) return { title: 'コースが見つかりません' }
  return { title: `${course.title} の進捗 | ShinCode Courses` }
}

export default async function CourseProgressPage({ params }: Props) {
  const { id } = await params

  const claims = await getRequestClaims()
  if (!claims?.sub) return null

  const [course, videos] = await Promise.all([getCourse(id), getVideos(id)])

  if (!course) notFound()

  const completedIds = await getCompletedVideoIds(claims.sub, videos.map((v) => v.id))
  const completed = completedIds.size
  const total = videos.length

  return (
    <div>
      <Link
        href="/mypage/courses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5022c3] hover:underline mb-5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        受講中のコースに戻る
      </Link>

      {/* コース概要 + 全体進捗 */}
      <div className="border border-[#d1d7dc] rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-[#1c1d1f]">{course.title}</h1>
          <Link
            href={`/courses/${course.id}`}
            className="text-sm font-bold text-[#5022c3] hover:underline shrink-0"
          >
            コースページを開く →
          </Link>
        </div>
        <div className="mt-5 max-w-md">
          <ProgressBar completed={completed} total={total} />
        </div>
      </div>

      {/* 動画ごとの視聴状況 */}
      <h2 className="text-lg font-bold text-[#1c1d1f] mt-8 mb-3">動画一覧</h2>
      {videos.length === 0 ? (
        <div className="border border-dashed border-[#d1d7dc] rounded-lg py-12 text-center">
          <p className="text-sm text-[#6a6f73]">このコースにはまだ動画がありません。</p>
        </div>
      ) : (
        <ul className="border border-[#d1d7dc] rounded-lg divide-y divide-[#d1d7dc] overflow-hidden">
          {videos.map((video, index) => {
            const done = completedIds.has(video.id)
            return (
              <li key={video.id}>
                <Link
                  href={`/courses/${course.id}/videos/${video.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#f7f9fa] transition-colors group"
                >
                  <span className="shrink-0 w-6 text-right text-sm font-medium text-[#6a6f73]">
                    {index + 1}
                  </span>
                  {done ? (
                    <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#16a34a] text-white">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-[#d1d7dc]" aria-label="未視聴" />
                  )}
                  <span className="text-[15px] font-medium text-[#1c1d1f] truncate group-hover:text-[#5022c3]">
                    {video.title}
                  </span>
                  <span className={`ml-auto shrink-0 text-xs font-bold ${done ? 'text-[#16a34a]' : 'text-[#6a6f73]'}`}>
                    {done ? '視聴済み' : '未視聴'}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
