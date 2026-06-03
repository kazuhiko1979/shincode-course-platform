'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { Course } from '@/types/course'
import { createCourse, updateCourse, type CourseFormState } from '@/app/admin/(protected)/courses/actions'

const inputClass =
  'mt-1 w-full rounded border border-[#9194a1] px-3 py-2 text-sm text-[#1c1d1f] focus:border-[#a435f0] focus:outline-none focus:ring-1 focus:ring-[#a435f0]'

export default function CourseForm({ course }: { course?: Course }) {
  const action = course ? updateCourse : createCourse
  const [state, formAction, pending] = useActionState<CourseFormState, FormData>(action, {})

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {course && <input type="hidden" name="id" value={course.id} />}

      <div>
        <label htmlFor="title" className="block text-sm font-bold text-[#1c1d1f]">
          タイトル <span className="text-red-600">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={course?.title ?? ''}
          className={inputClass}
          placeholder="例：はじめての React 19 完全ガイド"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-bold text-[#1c1d1f]">
          説明
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={course?.description ?? ''}
          className={inputClass}
          placeholder="コースの概要を入力してください"
        />
      </div>

      <div>
        <label htmlFor="thumbnail_url" className="block text-sm font-bold text-[#1c1d1f]">
          サムネイル URL
        </label>
        <input
          id="thumbnail_url"
          name="thumbnail_url"
          type="url"
          defaultValue={course?.thumbnail_url ?? ''}
          className={inputClass}
          placeholder="https://..."
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
          defaultValue={course?.order ?? 0}
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
          {pending ? '保存中...' : course ? '更新する' : '作成する'}
        </button>
        <Link
          href="/admin/courses"
          className="px-6 py-2.5 text-sm font-bold text-[#1c1d1f] border border-[#1c1d1f] rounded hover:bg-[#f7f9fa] transition-colors"
        >
          キャンセル
        </Link>
      </div>
    </form>
  )
}
