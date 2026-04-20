export default function ListingsLoading() {
  return (
    <div className="min-h-screen bg-[#E4F0F6] px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto">

        {/* Hero skeleton */}
        <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-sm px-6 py-5 mb-4">
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-sm px-6 py-4 mb-4 flex gap-8">
          {[64, 80, 120].map(w => (
            <div key={w}>
              <div className="h-2.5 w-16 bg-gray-100 rounded animate-pulse mb-1.5" />
              <div className={`h-4 bg-gray-200 rounded animate-pulse`} style={{ width: w }} />
            </div>
          ))}
        </div>

        {/* Filter skeleton */}
        <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-sm px-5 py-4 mb-6 space-y-3">
          <div className="flex gap-2">
            {[40, 56, 88, 40, 72].map((w, i) => (
              <div key={i} className="h-6 rounded-full bg-gray-100 animate-pulse" style={{ width: w }} />
            ))}
          </div>
          <div className="flex gap-2">
            {[96, 96, 56, 64, 80].map((w, i) => (
              <div key={i} className="h-6 rounded-full bg-gray-100 animate-pulse" style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* Row skeletons */}
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="bg-white rounded-xl border border-[#DFE1E6] shadow-sm p-4">
              <div className="flex items-start gap-4">
                <div className="w-20 shrink-0 space-y-1.5">
                  <div className="h-5 w-12 bg-gray-200 rounded animate-pulse ml-auto" />
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse ml-auto" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="h-5 w-14 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </li>
          ))}
        </ul>

      </div>
    </div>
  )
}
