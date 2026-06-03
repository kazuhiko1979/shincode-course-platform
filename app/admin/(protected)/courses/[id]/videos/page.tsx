import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCourse } from '@/lib/courses'
import { getVideos } from '@/lib/videos'
import DeleteVideoButton from '@/components/admin/DeleteVideoButton'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const course = await getCourse(id)
  return { title: course ? `「${course.title}」の動画管理 | ShinCode Admin` : 'コースが見つかりません' }
}

export default async function AdminVideosPage({ params }: Props) {
  const { id } = await params

  const [course, videos] = await Promise.all([getCourse(id), getVideos(id)])

  if (!course) notFound()

  return (
    <div>
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5022c3] hover:underline mb-5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        コース管理に戻る
      </Link>

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-sm text-[#6a6f73]">動画管理</p>
          <h1 className="text-2xl font-bold text-[#1c1d1f]">{course.title}</h1>
        </div>
        <Link
          href={`/admin/courses/${course.id}/videos/new`}
          className="px-5 py-2.5 text-sm font-bold text-white bg-[#a435f0] rounded hover:bg-[#8710d8] transition-colors"
        >
          + 動画を追加する
        </Link>
      </div>

      {videos.length === 0 ? (
        <div className="border border-dashed border-[#d1d7dc] rounded-lg py-16 text-center">
          <p className="text-sm text-[#6a6f73]">動画がまだありません。「動画を追加する」から追加してください。</p>
        </div>
      ) : (
        <div className="border border-[#d1d7dc] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f9fa] text-left text-[#6a6f73]">
              <tr>
                <th className="px-4 py-3 font-bold w-16">順序</th>
                <th className="px-4 py-3 font-bold">タイトル</th>
                <th className="px-4 py-3 font-bold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1d7dc]">
              {videos.map((video) => (
                <tr key={video.id} className="hover:bg-[#f7f9fa]">
                  <td className="px-4 py-3 text-[#6a6f73]">{video.order}</td>
                  <td className="px-4 py-3 font-medium text-[#1c1d1f]">{video.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/courses/${course.id}/videos/${video.id}/edit`}
                        className="text-sm font-medium text-[#1c1d1f] hover:underline"
                      >
                        編集
                      </Link>
                      <DeleteVideoButton
                        videoId={video.id}
                        courseId={course.id}
                        videoTitle={video.title}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
