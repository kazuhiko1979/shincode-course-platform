import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCourse } from '@/lib/courses'
import VideoForm from '@/components/admin/VideoForm'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const course = await getCourse(id)
  return { title: course ? `「${course.title}」に動画を追加 | ShinCode Admin` : 'コースが見つかりません' }
}

export default async function NewVideoPage({ params }: Props) {
  const { id } = await params
  const course = await getCourse(id)

  if (!course) notFound()

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

      <h1 className="text-2xl font-bold text-[#1c1d1f] mb-1">動画を追加</h1>
      <p className="text-sm text-[#6a6f73] mb-6">{course.title}</p>
      <VideoForm courseId={course.id} />
    </div>
  )
}
