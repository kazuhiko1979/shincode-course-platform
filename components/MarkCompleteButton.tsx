'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markVideoCompleted, unmarkVideoCompleted } from '@/app/courses/[id]/videos/[videoId]/actions'

type Props = {
  videoId: string
  courseId: string
  completed: boolean
}

export default function MarkCompleteButton({ videoId, courseId, completed }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = completed
        ? await unmarkVideoCompleted(videoId, courseId)
        : await markVideoCompleted(videoId, courseId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={pending}
        className={
          completed
            ? 'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-[#16a34a] bg-[#dcfce7] border border-[#16a34a] rounded hover:bg-[#bbf7d0] transition-colors disabled:opacity-60'
            : 'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#1c1d1f] rounded hover:bg-black transition-colors disabled:opacity-60'
        }
      >
        {completed ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {pending ? '更新中...' : '視聴完了済み'}
          </>
        ) : (
          <>{pending ? '記録中...' : '視聴完了にする'}</>
        )}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
