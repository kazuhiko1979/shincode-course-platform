import { createClient } from '@/lib/supabase/server'
import { safeRedirectPath, defaultPathForCurrentUser } from '@/lib/auth'
import { enrollCourse } from '@/app/courses/[id]/actions'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const enroll = searchParams.get('enroll')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // 受講意図があれば自動受講登録（Udemy 風）。重複は enrollCourse 側で握りつぶす
      if (enroll) {
        await enrollCourse(enroll)
      }
      // next が安全な相対パスならそこへ、無ければロール別デフォルトへ
      const safeNext = safeRedirectPath(next)
      const destination = safeNext ?? (await defaultPathForCurrentUser())
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=callback`)
}
