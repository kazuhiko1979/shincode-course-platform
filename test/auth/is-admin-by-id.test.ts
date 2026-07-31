// isAdminById の管理者判定テスト。
// 期待値は仕様「public.users.role = 'admin' のユーザーのみ管理者」（lib/auth.ts docstring /
// CLAUDE.md 管理者判定）から導出。Supabase はチェーン互換のスタブで代替する。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isAdminById } from '@/lib/auth'

type UserRow = { role: string } | null

function stubClient(row: UserRow): SupabaseClient {
  const chain = {
    select: () => chain,
    eq: () => chain,
    single: async () => ({ data: row, error: null }),
  }
  return { from: () => chain } as unknown as SupabaseClient
}

test("role='admin' のユーザーのみ true", async () => {
  assert.equal(await isAdminById(stubClient({ role: 'admin' }), 'uid-1'), true)
})

test("role='user'（既定ロール）は false", async () => {
  assert.equal(await isAdminById(stubClient({ role: 'user' }), 'uid-2'), false)
})

test('行が取得できない（RLS 不一致・未登録）場合は false', async () => {
  assert.equal(await isAdminById(stubClient(null), 'uid-3'), false)
})

test("role が想定外の値でも admin 以外は false（'ADMIN' 等の大文字も昇格させない）", async () => {
  assert.equal(await isAdminById(stubClient({ role: 'ADMIN' }), 'uid-4'), false)
  assert.equal(await isAdminById(stubClient({ role: '' }), 'uid-5'), false)
})
