'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setUserRole } from '@/app/admin/(protected)/users/actions'

type Props = {
  userId: string
  isAdmin: boolean
}

export default function RoleToggleButton({ userId, isAdmin }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const nextRole = isAdmin ? 'user' : 'admin'

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await setUserRole(userId, nextRole)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="px-3 py-1.5 text-xs font-bold text-[#5022c3] border border-[#5022c3] rounded hover:bg-[#f7f3ff] transition-colors disabled:opacity-60"
      >
        {pending ? '更新中...' : isAdmin ? '一般に変更' : '管理者に変更'}
      </button>
    </div>
  )
}
