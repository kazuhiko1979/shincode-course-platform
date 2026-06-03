'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCourse } from '@/app/admin/(protected)/courses/actions'

type Props = {
  courseId: string
  courseTitle: string
}

export default function DeleteCourseButton({ courseId, courseTitle }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteCourse(courseId)
      if (result?.error) {
        setError(result.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-red-600 hover:underline"
      >
        削除
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-lg font-bold text-[#1c1d1f]">コースを削除しますか？</h2>
            <p className="mt-2 text-sm text-[#3e4143]">
              「{courseTitle}」を削除すると、<strong>このコースの動画・受講登録・視聴履歴もすべて削除されます。</strong>
              この操作は取り消せません。
            </p>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="px-5 py-2.5 text-sm font-bold text-[#1c1d1f] border border-[#1c1d1f] rounded hover:bg-[#f7f9fa] transition-colors disabled:opacity-60"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {pending ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
