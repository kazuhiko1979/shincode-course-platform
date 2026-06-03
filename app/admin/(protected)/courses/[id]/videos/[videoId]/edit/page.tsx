import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCourse } from '@/lib/courses'
import { getVideo } from '@/lib/videos'
import VideoForm from '@/components/admin/VideoForm'

type Props = { params: Promise<{ id: string; videoId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { videoId } = await params
  const video = await getVideo(videoId)
  return { title: video ? `「${video.title}」を編集 | ShinCode Admin` : '動画が見つかりません' }
}

export default async function EditVideoPage({ params }: Props) {
  const { id, videoId } = await params

  const [course, video] = await Promise.all([getCourse(id), getVideo(videoId)])

  // コースが存在しない / 動画が存在しない / 動画がそのコースに属さない場合は 404
  if (!course || !video || video.course_id !== id) notFound()

  return (
    <div>
      <Link
        href={`/admin/courses/${course.id}/videos`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5022c3] hover:underline mb-5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        動画管理に戻る
      </Link>

      <h1 className="text-2xl font-bold text-[#1c1d1f] mb-1">動画を編集</h1>
      <p className="text-sm text-[#6a6f73] mb-6">{course.title}</p>
      <VideoForm courseId={course.id} video={video} />
    </div>
  )
}
