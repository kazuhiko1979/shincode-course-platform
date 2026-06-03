import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { safeRedirectPath, defaultPathForCurrentUser } from '@/lib/auth'
import { enrollCourse } from '@/app/courses/[id]/actions'
import GoogleLoginButton from './GoogleLoginButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; enroll?: string }>
}) {
  const { error, next, enroll } = await searchParams

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) {
    // 既にログイン済みで受講意図があれば自動受講登録してから遷移
    if (enroll) {
      await enrollCourse(enroll)
    }
    redirect(safeRedirectPath(next) ?? (await defaultPathForCurrentUser()))
  }

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 bg-[#f7f9fa]">
      <div className="w-full max-w-md bg-white border border-[#d1d7dc] shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-8 sm:p-10 animate-fade-up">
        <h1 className="text-2xl font-bold text-center text-[#1c1d1f] mb-2">
          無料登録して学習を始める
        </h1>
        <p className="text-sm text-center text-[#6a6f73] mb-8">
          Google アカウントでそのまま登録・ログインできます
        </p>

        {error && (
          <div className="mb-6 flex items-center gap-2.5 px-4 py-3 border border-[#f2b8b5] bg-[#fce8e6] text-sm text-[#8c1d18]">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            ログインに失敗しました。もう一度お試しください。
          </div>
        )}

        <GoogleLoginButton next={next} enroll={enroll} />

        <p className="mt-8 text-xs text-center text-[#6a6f73] leading-relaxed">
          続行することで、Udemy風講座プラットフォームの
          <br />
          <span className="text-[#5022c3] font-medium">利用規約</span> および{' '}
          <span className="text-[#5022c3] font-medium">プライバシーポリシー</span> に同意したものとみなされます。
        </p>
      </div>
    </div>
  )
}
