'use client'

interface Props {
  data: { name: string; color: string; count: number }[]
}

export function StageChart({ data }: Props) {
  const filtered = data.filter(d => d.count > 0)
  if (filtered.length === 0) {
    return <p className="text-[13px] text-muted-foreground text-center py-8">Нет данных</p>
  }

  const max = Math.max(...filtered.map(d => d.count))

  return (
    <ul className="space-y-2">
      {filtered.map(d => {
        const pct = Math.max(6, Math.round((d.count / max) * 100))
        return (
          <li key={d.name} className="flex items-center gap-3">
            <span
              className="w-[110px] shrink-0 truncate text-[12px] font-medium text-foreground/90"
              title={d.name}
            >
              {d.name}
            </span>
            <div className="relative flex-1 h-5 rounded-full bg-[var(--list)]/60 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${d.color}CC 0%, ${d.color} 100%)`,
                  boxShadow: `0 0 0 1px ${d.color}33 inset`,
                }}
              />
            </div>
            <span className="w-6 text-right text-[12px] font-semibold tabular-nums text-foreground">
              {d.count}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
