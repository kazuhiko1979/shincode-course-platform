export default function Loading() {
  return (
    <div className="bg-white">
      {/* ヒーロープレースホルダー */}
      <section className="bg-[#f7f9fa] border-b border-[#d1d7dc]">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24">
          <div className="max-w-xl bg-white border border-[#d1d7dc] p-8">
            <div className="h-9 w-3/4 rounded bg-[#e8eaed] animate-pulse" />
            <div className="mt-4 h-4 w-full rounded bg-[#e8eaed] animate-pulse" />
            <div className="mt-2 h-4 w-5/6 rounded bg-[#e8eaed] animate-pulse" />
            <div className="mt-6 h-11 w-48 rounded bg-[#e8eaed] animate-pulse" />
          </div>
        </div>
      </section>

      {/* コースグリッドのスケルトン */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <div className="h-7 w-40 rounded bg-[#e8eaed] animate-pulse mb-2" />
        <div className="h-4 w-56 rounded bg-[#e8eaed] animate-pulse mb-8" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-video border border-[#d1d7dc] bg-[#e8eaed] animate-pulse" />
              <div className="pt-2.5">
                <div className="h-4 w-full rounded bg-[#e8eaed] animate-pulse" />
                <div className="mt-2 h-3 w-2/3 rounded bg-[#e8eaed] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
