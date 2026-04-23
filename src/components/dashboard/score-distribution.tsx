'use client'

interface Props {
  data: { name: string; color: string; count: number }[]
}

export function ScoreDistributionChart({ data }: Props) {
  if (data.every(d => d.count === 0)) {
    return <p className="text-[13px] text-muted-foreground text-center py-8">Нет данных</p>
  }

  const max = Math.max(...data.map(d => d.count))
  const CHART_H = 150

  return (
    <div className="flex items-end justify-between gap-3 h-[200px] pt-2">
      {data.map(d => {
        const pct = max > 0 ? d.count / max : 0
        const h = Math.max(d.count > 0 ? 8 : 2, Math.round(pct * CHART_H))
        return (
          <div key={d.name} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold tabular-nums text-foreground/80">
              {d.count > 0 ? d.count : ''}
            </span>
            <div
              className="relative w-full max-w-[56px] rounded-t-md overflow-hidden"
              style={{
                height: h,
                background: d.count > 0
                  ? `linear-gradient(180deg, ${d.color} 0%, ${d.color}99 100%)`
                  : 'var(--list)',
                boxShadow: d.count > 0
                  ? `0 0 0 1px ${d.color}44 inset, 0 -4px 12px -4px ${d.color}66 inset`
                  : undefined,
              }}
            >
              {d.count > 0 && (
                <div
                  className="absolute inset-x-0 top-0 h-1/3"
                  style={{ background: `linear-gradient(180deg, ${d.color}FF 0%, transparent 100%)`, opacity: 0.6 }}
                />
              )}
            </div>
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
              {d.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
