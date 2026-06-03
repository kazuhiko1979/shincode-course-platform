type Props = {
  role: 'user' | 'admin'
  size?: 'sm' | 'md'
}

/** role を視覚的に区別するバッジ。admin=紫、user=グレー。 */
export default function RoleBadge({ role, size = 'md' }: Props) {
  const isAdmin = role === 'admin'
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${pad} ${
        isAdmin
          ? 'bg-[#f3edff] text-[#5022c3] ring-1 ring-[#cec0fc]'
          : 'bg-[#f0f1f3] text-[#3e4143] ring-1 ring-[#d1d7dc]'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-[#a435f0]' : 'bg-[#6a6f73]'}`} />
      {isAdmin ? '管理者' : '一般ユーザー'}
    </span>
  )
}
