import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminById } from '@/lib/auth'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // トークンをリフレッシュしつつ JWT 署名を検証してクレームを取得する
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  const isAuthed = !!userId

  const { pathname } = request.nextUrl

  // 未認証ガード：/mypage・/admin いずれも統一ログイン（/auth/login）へ。
  // 元の遷移先を next に載せてログイン後に復帰させる。
  if (!isAuthed && (pathname.startsWith('/mypage') || pathname.startsWith('/admin'))) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.search = ''
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // /admin は users.role = 'admin' のみ許可。一般ユーザーはマイページへ逃がす。
  if (isAuthed && pathname.startsWith('/admin') && !(await isAdminById(supabase, userId))) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/mypage'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
