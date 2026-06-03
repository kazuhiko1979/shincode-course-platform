import Link from 'next/link'
import type { Metadata } from 'next'
import { getCourses } from '@/lib/courses'
import DeleteCourseButton from '@/components/admin/DeleteCourseButton'

export const metadata: Metadata = {
  title: 'コース管理 | ShinCode Admin',
}

export default async function AdminCoursesPage() {
  const courses = await getCourses()

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#1c1d1f]">コース管理</h1>
        <Link
          href="/admin/courses/new"
          className="px-5 py-2.5 text-sm font-bold text-white bg-[#a435f0] rounded hover:bg-[#8710d8] transition-colors"
        >
          + 新規コース作成
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="border border-dashed border-[#d1d7dc] rounded-lg py-16 text-center">
          <p className="text-sm text-[#6a6f73]">コースがまだありません。「新規コース作成」から追加してください。</p>
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
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-[#f7f9fa]">
                  <td className="px-4 py-3 text-[#6a6f73]">{course.order}</td>
                  <td className="px-4 py-3 font-medium text-[#1c1d1f]">{course.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/courses/${course.id}/videos`}
                        className="text-sm font-medium text-[#5022c3] hover:underline"
                      >
                        動画管理
                      </Link>
                      <Link
                        href={`/admin/courses/${course.id}/edit`}
                        className="text-sm font-medium text-[#1c1d1f] hover:underline"
                      >
                        編集
                      </Link>
                      <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
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
