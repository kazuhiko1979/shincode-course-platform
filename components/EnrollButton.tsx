'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { enrollCourse } from '@/app/courses/[id]/actions'

export default function EnrollButton({ courseId }: { courseId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await enrollCourse(courseId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      // revalidatePath の結果を現在の画面に反映する
      router.refresh()
    })
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={pending}
        className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-white bg-[#a435f0] rounded hover:bg-[#8710d8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? '登録中...' : '受講登録する'}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
