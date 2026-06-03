'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { Video } from '@/types/video'
import { createVideo, updateVideo, type VideoFormState } from '@/app/admin/(protected)/courses/[id]/videos/actions'

const inputClass =
  'mt-1 w-full rounded border border-[#9194a1] px-3 py-2 text-sm text-[#1c1d1f] focus:border-[#a435f0] focus:outline-none focus:ring-1 focus:ring-[#a435f0]'

type Props = {
  courseId: string
  video?: Video
}

export default function VideoForm({ courseId, video }: Props) {
  const action = video ? updateVideo : createVideo
  const [state, formAction, pending] = useActionState<VideoFormState, FormData>(action, {})

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <input type="hidden" name="course_id" value={courseId} />
      {video && <input type="hidden" name="id" value={video.id} />}

      <div>
        <label htmlFor="title" className="block text-sm font-bold text-[#1c1d1f]">
          タイトル <span className="text-red-600">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={video?.title ?? ''}
          className={inputClass}
          placeholder="例：イントロダクション"
        />
      </div>

      <div>
        <label htmlFor="youtube_url" className="block text-sm font-bold text-[#1c1d1f]">
          YouTube URL <span className="text-red-600">*</span>
        </label>
        <input
          id="youtube_url"
          name="youtube_url"
          type="url"
          required
          pattern="https?://.*(youtube\.com|youtu\.be).*"
          defaultValue={video?.youtube_url ?? ''}
          className={inputClass}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <p className="mt-1 text-xs text-[#6a6f73]">
          watch?v= / youtu.be / embed いずれの形式でも可。
        </p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-bold text-[#1c1d1f]">
          説明
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={video?.description ?? ''}
          className={inputClass}
          placeholder="動画の概要を入力してください"
        />
      </div>

      <div>
        <label htmlFor="order" className="block text-sm font-bold text-[#1c1d1f]">
          表示順
        </label>
        <input
          id="order"
          name="order"
          type="number"
          defaultValue={video?.order ?? 0}
          className={`${inputClass} max-w-[8rem]`}
        />
        <p className="mt-1 text-xs text-[#6a6f73]">小さいほど先に表示されます。</p>
      </div>

      {state.error && (
        <p className="text-sm text-red-600 font-medium" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 text-sm font-bold text-white bg-[#a435f0] rounded hover:bg-[#8710d8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? '保存中...' : video ? '更新する' : '追加する'}
        </button>
        <Link
          href={`/admin/courses/${courseId}/videos`}
          className="px-6 py-2.5 text-sm font-bold text-[#1c1d1f] border border-[#1c1d1f] rounded hover:bg-[#f7f9fa] transition-colors"
        >
          キャンセル
        </Link>
      </div>
    </form>
  )
}
