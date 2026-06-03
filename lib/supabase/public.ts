import { createClient } from '@supabase/supabase-js'

/**
 * cookies に依存しない匿名 Supabase クライアント。
 *
 * `'use cache'` スコープ内では `cookies()` を読む SSR クライアント（`server.ts`）は使えないため、
 * 公開データ（RLS で全員 SELECT 可の `courses` / `videos`）のキャッシュ可能な取得にはこちらを使う。
 * セッションを持たない＝全ユーザー共通の結果になるので安全にキャッシュできる。
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
