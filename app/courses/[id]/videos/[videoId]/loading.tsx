export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
      <div className="min-w-0">
        <div className="h-4 w-32 rounded bg-[#e8eaed] animate-pulse mb-4" />
        <div className="aspect-video rounded-lg bg-[#e8eaed] animate-pulse" />
        <div className="mt-5 h-7 w-2/3 rounded bg-[#e8eaed] animate-pulse" />
        <div className="mt-3 h-4 w-full rounded bg-[#e8eaed] animate-pulse" />
        <div className="mt-2 h-4 w-4/5 rounded bg-[#e8eaed] animate-pulse" />
        <div className="mt-5 h-10 w-40 rounded bg-[#e8eaed] animate-pulse" />
      </div>

      <aside className="lg:border-l lg:border-[#d1d7dc] lg:pl-6">
        <div className="h-4 w-28 rounded bg-[#e8eaed] animate-pulse mb-3" />
        <div className="border border-[#d1d7dc] rounded-lg divide-y divide-[#d1d7dc]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-4 w-4 rounded bg-[#e8eaed] animate-pulse" />
              <div className="h-4 flex-1 rounded bg-[#e8eaed] animate-pulse" />
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
