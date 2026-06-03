export default function Loading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-[#d1d7dc] rounded-lg overflow-hidden">
          <div className="aspect-video bg-[#e8eaed] animate-pulse" />
          <div className="p-4">
            <div className="h-4 w-full rounded bg-[#e8eaed] animate-pulse" />
            <div className="mt-2 h-4 w-2/3 rounded bg-[#e8eaed] animate-pulse" />
            <div className="mt-5 h-2 w-full rounded-full bg-[#e8eaed] animate-pulse" />
            <div className="mt-2 h-3 w-32 rounded bg-[#e8eaed] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
