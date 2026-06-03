export default function ProgressBar({
  completed,
  total,
}: {
  completed: number
  total: number
}) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div>
      <div className="h-2 w-full bg-[#e8eaed] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#16a34a] rounded-full transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-[#6a6f73]">
        {completed} / {total} 本完了（{percent}%）
      </p>
    </div>
  )
}
