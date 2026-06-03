import type { Metadata } from 'next'
import { getAdminStats } from '@/lib/admin'
import RoleBadge from '@/components/admin/RoleBadge'

export const metadata: Metadata = {
  title: '統計・分析 | ShinCode Admin',
}

function StatTile({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="border border-[#d1d7dc] rounded-lg p-5">
      <p className="text-sm text-[#6a6f73]">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#1c1d1f]">{value.toLocaleString('ja-JP')}</p>
      {sub && <p className="mt-1 text-xs text-[#6a6f73]">{sub}</p>}
    </div>
  )
}

export default async function AdminStatsPage() {
  const stats = await getAdminStats()

  if (!stats) {
    return <p className="text-sm text-[#6a6f73]">統計を取得できませんでした。</p>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1c1d1f]">統計・分析</h1>
        <p className="mt-1 text-sm text-[#6a6f73]">プラットフォーム全体の利用状況のサマリーです。</p>
      </div>

      {/* 主要指標 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatTile label="ユーザー数" value={stats.users_total} sub={`うち管理者 ${stats.admins_total}`} />
        <StatTile label="コース数" value={stats.courses_total} />
        <StatTile label="動画数" value={stats.videos_total} />
        <StatTile label="受講登録数" value={stats.enrollments_total} />
        <StatTile label="視聴完了数" value={stats.completions_total} />
      </div>

      {/* 人気コース */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-[#1c1d1f] mb-3">受講登録の多いコース</h2>
        <div className="border border-[#d1d7dc] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f9fa] text-left text-[#6a6f73]">
              <tr>
                <th className="px-4 py-3 font-bold">コース</th>
                <th className="px-4 py-3 font-bold w-32 text-right">受講登録数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1d7dc]">
              {stats.top_courses.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-[#6a6f73]">
                    データがありません
                  </td>
                </tr>
              ) : (
                stats.top_courses.map((c) => (
                  <tr key={c.id} className="hover:bg-[#f7f9fa]">
                    <td className="px-4 py-3 font-medium text-[#1c1d1f]">{c.title}</td>
                    <td className="px-4 py-3 text-right text-[#3e4143]">{c.enrollments}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 最近の登録ユーザー */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-[#1c1d1f] mb-3">最近登録したユーザー</h2>
        <div className="border border-[#d1d7dc] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f9fa] text-left text-[#6a6f73]">
              <tr>
                <th className="px-4 py-3 font-bold">メールアドレス</th>
                <th className="px-4 py-3 font-bold w-36">権限</th>
                <th className="px-4 py-3 font-bold w-32">登録日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1d7dc]">
              {stats.recent_signups.map((u) => (
                <tr key={u.email} className="hover:bg-[#f7f9fa]">
                  <td className="px-4 py-3 font-medium text-[#1c1d1f]">{u.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-[#6a6f73]">
                    {new Date(u.created_at).toLocaleDateString('ja-JP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
