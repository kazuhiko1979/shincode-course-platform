import Link from 'next/link'
import type { Metadata } from 'next'
import CourseForm from '@/components/admin/CourseForm'

export const metadata: Metadata = {
  title: '新規コース作成 | ShinCode Admin',
}

export default function NewCoursePage() {
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

      <h1 className="text-2xl font-bold text-[#1c1d1f] mb-6">新規コース作成</h1>
      <CourseForm />
    </div>
  )
}
