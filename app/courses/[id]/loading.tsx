export default function Loading() {
  return (
    <div className="bg-white">
      {/* ヘッダープレースホルダー */}
      <section className="bg-[#1c1d1f]">
        <div className="max-w-7xl mx-auto px-6 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-start">
          <div className="max-w-2xl w-full">
            <div className="h-4 w-40 rounded bg-white/10 animate-pulse" />
            <div className="mt-5 h-8 w-3/4 rounded bg-white/15 animate-pulse" />
            <div className="mt-4 h-4 w-full rounded bg-white/10 animate-pulse" />
            <div className="mt-2 h-4 w-5/6 rounded bg-white/10 animate-pulse" />
            <div className="mt-6 h-11 w-44 rounded bg-white/15 animate-pulse" />
          </div>
          <div className="w-full lg:w-80 shrink-0">
            <div className="aspect-video rounded bg-white/10 animate-pulse" />
          </div>
        </div>
      </section>

      {/* カリキュラムのスケルトン */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="h-6 w-32 rounded bg-[#e8eaed] animate-pulse mb-5" />
        <div className="border border-[#d1d7dc] rounded-lg divide-y divide-[#d1d7dc]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-4 w-5 rounded bg-[#e8eaed] animate-pulse" />
              <div className="h-5 w-5 rounded bg-[#e8eaed] animate-pulse" />
              <div className="h-4 flex-1 max-w-md rounded bg-[#e8eaed] animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
