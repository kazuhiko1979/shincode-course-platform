import Link from 'next/link'
import type { Metadata } from 'next'
import { getAdminStats } from '@/lib/admin'

export const metadata: Metadata = {
  title: '管理者ダッシュボード | ShinCode Admin',
}

const SECTIONS = [
  {
    href: '/admin/courses',
    title: 'コース管理',
    desc: 'コース・動画の作成、編集、削除を行います。',
  },
  {
    href: '/admin/users',
    title: 'ユーザー管理',
    desc: '登録ユーザーの一覧と権限（user ⇔ admin）の変更を行います。',
  },
  {
    href: '/admin/stats',
    title: '統計・分析',
    desc: 'ユーザー数・受講登録・人気コースなどの利用状況を確認します。',
  },
]

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-[#d1d7dc] rounded-lg p-5">
      <p className="text-sm text-[#6a6f73]">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#1c1d1f]">{value.toLocaleString('ja-JP')}</p>
    </div>
  )
}

export default async function AdminDashboard() {
  const stats = await getAdminStats()

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1c1d1f] mb-6">管理者ダッシュボード</h1>

      {/* 主要指標サマリー */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatTile label="ユーザー数" value={stats.users_total} />
          <StatTile label="コース数" value={stats.courses_total} />
          <StatTile label="受講登録数" value={stats.enrollments_total} />
          <StatTile label="視聴完了数" value={stats.completions_total} />
        </div>
      )}

      {/* 機能ナビゲーション */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block border border-[#d1d7dc] rounded-lg p-6 hover:border-[#a435f0] hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all"
          >
            <h2 className="text-lg font-bold text-[#1c1d1f]">{s.title}</h2>
            <p className="mt-2 text-sm text-[#6a6f73] leading-relaxed">{s.desc}</p>
            <span className="mt-4 inline-block text-sm font-bold text-[#5022c3]">開く →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
