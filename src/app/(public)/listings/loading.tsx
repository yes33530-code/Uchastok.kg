export default function ListingsLoading() {
  return (
    <div className="px-4 sm:px-6 pt-12 sm:pt-16 pb-10">
      <div className="max-w-6xl mx-auto">

        {/* Hero skeleton */}
        <div className="mb-10 sm:mb-14">
          <div className="h-3 w-36 rounded bg-muted animate-pulse mb-4" />
          <div className="h-11 sm:h-14 rounded-lg bg-muted animate-pulse max-w-xl mb-3" />
          <div className="h-11 sm:h-14 rounded-lg bg-muted animate-pulse max-w-md mb-5" />
          <div className="h-4 w-72 rounded bg-muted animate-pulse" />

          <div className="mt-6 flex flex-wrap gap-2">
            {[140, 170, 180].map(w => (
              <div key={w} className="h-7 rounded-full bg-muted animate-pulse" style={{ width: w }} />
            ))}
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 w-20 rounded bg-muted animate-pulse mb-2" />
                <div className="h-7 w-28 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Filter skeleton */}
        <div className="rounded-2xl border border-border bg-card ring-1 ring-foreground/5 p-5 mb-8 space-y-4">
          <div className="flex gap-1.5 flex-wrap">
            {[48, 68, 112, 52, 96].map((w, i) => (
              <div key={i} className="h-7 rounded-lg bg-muted animate-pulse" style={{ width: w }} />
            ))}
          </div>
          <div className="h-px bg-border" />
          <div className="flex gap-1.5 flex-wrap">
            {[112, 112, 68, 76, 92].map((w, i) => (
              <div key={i} className="h-7 rounded-lg bg-muted animate-pulse" style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* Row skeletons */}
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="rounded-2xl bg-card ring-1 ring-foreground/10 overflow-hidden">
              <div className="h-24 bg-muted animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 rounded bg-muted animate-pulse w-3/4" />
                <div className="h-4 rounded bg-muted/70 animate-pulse w-1/2" />
                <div className="h-4 rounded bg-muted animate-pulse w-28 mt-4" />
                <div className="pt-4 border-t border-border flex justify-between">
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                </div>
              </div>
            </li>
          ))}
        </ul>

      </div>
    </div>
  )
}
