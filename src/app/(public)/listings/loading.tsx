export default function ListingsLoading() {
  return (
    <div className="px-4 sm:px-6 pt-10 sm:pt-12 pb-10">
      <div className="max-w-6xl mx-auto">

        {/* Hero skeleton */}
        <div className="mb-8 sm:mb-10">
          <div className="h-3 w-36 rounded bg-muted animate-pulse mb-3" />
          <div className="h-9 sm:h-11 rounded-lg bg-muted animate-pulse max-w-md mb-3" />
          <div className="h-4 w-80 rounded bg-muted animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 lg:gap-8 items-start">
          {/* Rows column */}
          <div className="min-w-0 lg:order-1 order-2">
            <div className="h-4 w-40 rounded bg-muted animate-pulse mb-4" />
            <ul className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-stretch rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden h-28">
                  <div className="w-28 sm:w-36 shrink-0 bg-muted animate-pulse" />
                  <div className="w-px bg-border shrink-0" />
                  <div className="flex-1 flex">
                    <div className="flex-1 min-w-0 p-4 space-y-2">
                      <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
                      <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
                      <div className="h-4 w-1/2 rounded bg-muted/70 animate-pulse" />
                    </div>
                    <div className="hidden sm:block w-48 shrink-0 border-l border-border p-4 space-y-2">
                      <div className="h-3 w-16 rounded bg-muted animate-pulse ml-auto" />
                      <div className="h-5 w-20 rounded bg-muted animate-pulse ml-auto" />
                    </div>
                    <div className="hidden sm:block w-52 shrink-0 border-l border-border p-4 space-y-2.5">
                      <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Filter sidebar skeleton */}
          <aside className="lg:order-2 order-1 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-card ring-1 ring-foreground/5 p-5 space-y-5">
              <div className="h-5 w-24 rounded bg-muted animate-pulse" />
              <div className="h-px bg-border" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2.5">
                  <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                  <div className="flex gap-1.5 flex-wrap">
                    {[48, 68, 80, 52].map((w, j) => (
                      <div key={j} className="h-7 rounded-lg bg-muted animate-pulse" style={{ width: w }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>

      </div>
    </div>
  )
}
