import Image from 'next/image'
import Link from 'next/link'
import type { Course } from '@/types/course'

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a435f0]"
    >
      {/* サムネイル */}
      <div className="relative aspect-video border border-[#d1d7dc] overflow-hidden bg-[#f7f9fa]">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600">
            <svg className="w-12 h-12 text-white/40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>

      {/* 情報 */}
      <div className="pt-2.5">
        <h3 className="font-bold text-[15px] text-[#1c1d1f] leading-snug line-clamp-2 group-hover:text-[#5022c3]">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-xs text-[#6a6f73] mt-1 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        )}
      </div>
    </Link>
  )
}
