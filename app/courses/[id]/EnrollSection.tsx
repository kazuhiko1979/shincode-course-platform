import Link from 'next/link'
import { getRequestClaims } from '@/lib/auth'
import { getEnrollment } from '@/lib/enrollments'
import EnrollButton from '@/components/EnrollButton'

/**
 * コース詳細の受講状態 UI（ユーザー依存・動的）。
 * cookies を読むため Suspense 境界の内側で使い、キャッシュ済みのコース情報とは独立にストリームする。
 */
export default async function EnrollSection({ courseId }: { courseId: string }) {
  const claims = await getRequestClaims()
  const isEnrolled = claims?.sub
    ? (await getEnrollment(claims.sub, courseId)) !== null
    : false

  if (isEnrolled) {
    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#16a34a] rounded">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        受講中
      </span>
    )
  }

  if (claims) {
    return <EnrollButton courseId={courseId} />
  }

  return (
    <Link
      href={`/auth/login?next=/courses/${courseId}&enroll=${courseId}`}
      className="inline-block px-8 py-3 text-sm font-bold text-white bg-[#a435f0] rounded hover:bg-[#8710d8] transition-colors"
    >
      登録して受講する
    </Link>
  )
}
