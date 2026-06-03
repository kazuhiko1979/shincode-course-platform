import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getRequestClaims } from '@/lib/auth'
import { getVideo, getVideos } from '@/lib/videos'
import { getVideoProgress, getCompletedVideoIds } from '@/lib/video_progress'
import { getYouTubeEmbedUrl } from '@/lib/youtube'
import MarkCompleteButton from '@/components/MarkCompleteButton'

type Props = { params: Promise<{ id: string; videoId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { videoId } = await params
  const video = await getVideo(videoId)
  if (!video) return { title: '動画が見つかりません' }
  return {
    title: `${video.title} | ShinCode Courses`,
    description: video.description ?? undefined,
  }
}

export default async function VideoPage({ params }: Props) {
  const { id: courseId, videoId } = await params

  const claims = await getRequestClaims()
  const userId = claims?.sub

  const [video, videos, isCompleted] = await Promise.all([
    getVideo(videoId),
    getVideos(courseId),
    userId ? getVideoProgress(userId, videoId) : Promise.resolve(false),
  ])

  // 動画が存在しない / コースに属していない場合は 404
  if (!video || video.course_id !== courseId) notFound()

  const completedIds = userId
    ? await getCompletedVideoIds(userId, videos.map((v) => v.id))
    : new Set<string>()

  const embedUrl = getYouTubeEmbedUrl(video.youtube_url)
  const currentIndex = videos.findIndex((v) => v.id === video.id)
  const prevVideo = currentIndex > 0 ? videos[currentIndex - 1] : null
  const nextVideo =
    currentIndex >= 0 && currentIndex < videos.length - 1 ? videos[currentIndex + 1] : null

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
      {/* メイン */}
      <div className="min-w-0">
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5022c3] hover:underline mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          コース詳細に戻る
        </Link>

        {/* プレーヤー */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-[#d1d7dc]">
          {embedUrl ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={embedUrl}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-center px-6">
              <p className="text-sm text-white/70">
                この動画の URL から再生用 ID を取得できませんでした。
              </p>
            </div>
          )}
        </div>

        {/* タイトル・説明・完了ボタン */}
        <div className="mt-5">
          <h1 className="text-xl sm:text-2xl font-bold text-[#1c1d1f]">{video.title}</h1>
          {video.description && (
            <p className="mt-3 text-[#3e4143] leading-relaxed whitespace-pre-wrap">
              {video.description}
            </p>
          )}

          <div className="mt-5">
            {userId ? (
              <MarkCompleteButton videoId={video.id} courseId={courseId} completed={isCompleted} />
            ) : (
              <Link
                href={`/auth/login?next=/courses/${courseId}/videos/${video.id}`}
                className="inline-block px-5 py-2.5 text-sm font-bold text-white bg-[#1c1d1f] rounded hover:bg-black transition-colors"
              >
                ログインして進捗を記録
              </Link>
            )}
          </div>
        </div>

        {/* 前後ナビ */}
        <div className="mt-8 flex items-stretch justify-between gap-4 border-t border-[#d1d7dc] pt-5">
          {prevVideo ? (
            <Link
              href={`/courses/${courseId}/videos/${prevVideo.id}`}
              className="flex-1 group flex flex-col items-start text-left max-w-[48%]"
            >
              <span className="text-xs text-[#6a6f73]">← 前の動画</span>
              <span className="text-sm font-medium text-[#1c1d1f] truncate w-full group-hover:text-[#5022c3]">
                {prevVideo.title}
              </span>
            </Link>
          ) : (
            <span className="flex-1 max-w-[48%]" />
          )}

          {nextVideo ? (
            <Link
              href={`/courses/${courseId}/videos/${nextVideo.id}`}
              className="flex-1 group flex flex-col items-end text-right max-w-[48%]"
            >
              <span className="text-xs text-[#6a6f73]">次の動画 →</span>
              <span className="text-sm font-medium text-[#1c1d1f] truncate w-full group-hover:text-[#5022c3]">
                {nextVideo.title}
              </span>
            </Link>
          ) : (
            <span className="flex-1 max-w-[48%]" />
          )}
        </div>
      </div>

      {/* サイドバー：コース内動画リスト */}
      <aside className="lg:border-l lg:border-[#d1d7dc] lg:pl-6">
        <h2 className="text-sm font-bold text-[#1c1d1f] mb-3">コースの動画</h2>
        <ul className="border border-[#d1d7dc] rounded-lg divide-y divide-[#d1d7dc] overflow-hidden">
          {videos.map((v, index) => {
            const isCurrent = v.id === video.id
            const done = completedIds.has(v.id)
            return (
              <li key={v.id}>
                <Link
                  href={`/courses/${courseId}/videos/${v.id}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isCurrent
                      ? 'bg-[#f0eafc] border-l-4 border-[#a435f0]'
                      : 'hover:bg-[#f7f9fa] border-l-4 border-transparent'
                  }`}
                >
                  <span className="shrink-0 w-5 text-right text-xs font-medium text-[#6a6f73]">
                    {index + 1}
                  </span>
                  {done ? (
                    <svg className="shrink-0 w-4 h-4 text-[#16a34a]" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="shrink-0 w-4 h-4 text-[#a435f0]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                  <span
                    className={`text-sm truncate ${
                      isCurrent ? 'font-bold text-[#5022c3]' : 'font-medium text-[#1c1d1f]'
                    }`}
                  >
                    {v.title}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </aside>
    </div>
  )
}
