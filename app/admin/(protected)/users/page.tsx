import type { Metadata } from 'next'
import { listUsers } from '@/lib/admin'
import { getRequestClaims } from '@/lib/auth'
import RoleBadge from '@/components/admin/RoleBadge'
import RoleToggleButton from '@/components/admin/RoleToggleButton'

export const metadata: Metadata = {
  title: 'ユーザー管理 | ShinCode Admin',
}

export default async function AdminUsersPage() {
  const claims = await getRequestClaims()
  const selfId = claims?.sub

  const users = await listUsers()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1c1d1f]">ユーザー管理</h1>
        <p className="mt-1 text-sm text-[#6a6f73]">
          登録ユーザーの一覧と権限（role）の変更を行います。全ユーザーは登録時に「一般ユーザー」になります。
        </p>
      </div>

      <div className="border border-[#d1d7dc] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f7f9fa] text-left text-[#6a6f73]">
            <tr>
              <th className="px-4 py-3 font-bold">ユーザー</th>
              <th className="px-4 py-3 font-bold w-36">権限</th>
              <th className="px-4 py-3 font-bold w-24 text-right">受講数</th>
              <th className="px-4 py-3 font-bold w-32">登録日</th>
              <th className="px-4 py-3 font-bold w-48 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d1d7dc]">
            {users.map((u) => {
              const isAdmin = u.role === 'admin'
              const isSelf = u.id === selfId
              return (
                <tr key={u.id} className="hover:bg-[#f7f9fa]">
                  <td className="px-4 py-3 font-medium text-[#1c1d1f]">
                    {u.email}
                    {isSelf && <span className="ml-2 text-xs text-[#6a6f73]">(あなた)</span>}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-right text-[#3e4143]">{u.enrollment_count}</td>
                  <td className="px-4 py-3 text-[#6a6f73]">
                    {new Date(u.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-4 py-3">
                    <RoleToggleButton userId={u.id} isAdmin={isAdmin} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
