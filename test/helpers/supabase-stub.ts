import type { SupabaseClient } from '@supabase/supabase-js'

type QueryChain = {
  select: () => QueryChain
  eq: () => QueryChain
  single: () => Promise<{ data: unknown; error: null }>
}

/**
 * isAdminById のような単純な Supabase クエリをテストするための最小スタブ。
 * ルートの DB 依存を避け、入力に応じた row を返す。
 */
export function createSupabaseStub(row: unknown = null): SupabaseClient {
  const chain: QueryChain = {
    select: () => chain,
    eq: () => chain,
    single: async () => ({ data: row, error: null }),
  }

  return {
    from: () => chain,
  } as unknown as SupabaseClient
}
