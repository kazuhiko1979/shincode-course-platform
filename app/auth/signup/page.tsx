import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { safeRedirectPath, defaultPathForCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import GoogleOAuthButton from '@/components/GoogleOAuthButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '無料登録 | 講座プラットフォーム',
  description: 'Google アカウントで無料登録して、すべての講座を受講しましょう。',
  robots: { index: false },
}

const BENEFITS = [
  { icon: '📚', text: '全コースを無料で受講' },
  { icon: '✅', text: '視聴進捗を自動で記録' },
  { icon: '🗂️', text: 'マイページで受講中コースを管理' },
]

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; enroll?: string }>
}) {
  const { next, enroll } = await searchParams

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) {
    redirect(safeRedirectPath(next) ?? (await defaultPathForCurrentUser()))
  }

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 bg-[#f7f9fa]">
      <div className="w-full max-w-md bg-white border border-[#d1d7dc] shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-8 sm:p-10 animate-fade-up">
        <h1 className="text-2xl font-bold text-center text-[#1c1d1f] mb-2">
          無料で学習を始めよう
        </h1>
        <p className="text-sm text-center text-[#6a6f73] mb-6">
          Google アカウントですぐに登録できます
        </p>

        <ul className="mb-8 space-y-3">
          {BENEFITS.map(({ icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-[#1c1d1f]">
              <span className="text-base w-6 text-center shrink-0" aria-hidden="true">{icon}</span>
              {text}
            </li>
          ))}
        </ul>

        <GoogleOAuthButton next={next} enroll={enroll} label="Google で無料登録" />

        <p className="mt-6 text-xs text-center text-[#6a6f73] leading-relaxed">
          続行することで、
          <span className="text-[#5022c3] font-medium">利用規約</span> および{' '}
          <span className="text-[#5022c3] font-medium">プライバシーポリシー</span>{' '}
          に同意したものとみなされます。
        </p>

        <div className="mt-6 pt-6 border-t border-[#d1d7dc] text-center">
          <p className="text-sm text-[#6a6f73]">
            すでにアカウントをお持ちの方は{' '}
            <Link
              href={next ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login'}
              className="text-[#5022c3] font-medium hover:underline"
            >
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
