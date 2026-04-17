'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Paperclip, AlignLeft, Zap, Droplets, Flame, Waves } from 'lucide-react'
import { ScoreBadge } from '@/components/ui/score-badge'
import { formatSotok, formatUSD, daysAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Plot } from '@/types/plot'

interface Props {
  plot: Plot
  isDragging?: boolean
  onOpen?: () => void
  fileCounts: Record<string, number>
}

type LabelItem = { name: string; color: string }

export function KanbanCard({ plot, isDragging = false, onOpen, fileCounts }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: plot.id, data: { type: 'card' } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: '#131c2e',
    border: '1px solid rgba(255,255,255,0.08)',
  }

  const isBeingDragged = isDragging || isSortableDragging

  let labels: LabelItem[] = []
  try {
    const raw = plot.labels
    if (Array.isArray(raw)) labels = raw as LabelItem[]
  } catch { /* ignore */ }

  const fileCount = fileCounts[plot.id] ?? 0
  const hasNotes = !!plot.notes?.trim()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={isBeingDragged ? undefined : onOpen}
      className={cn(
        'rounded-lg shadow-sm select-none cursor-pointer overflow-hidden',
        isBeingDragged ? 'opacity-40' : 'hover:brightness-125 transition-all'
      )}
    >
      {/* Label chips */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 px-2.5 pt-2">
          {labels.map((lbl, i) => (
            <span
              key={i}
              className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: lbl.color + '28', color: lbl.color, border: `1px solid ${lbl.color}50` }}
            >
              {lbl.name}
            </span>
          ))}
        </div>
      )}

      <div className="px-2.5 py-2 space-y-1.5">
        {/* Title — address */}
        <p className="font-semibold text-sm text-white leading-snug line-clamp-3">
          {plot.address}
        </p>

        {/* Size + Price row */}
        <div className="flex items-center gap-2 text-xs text-white/45">
          {plot.size_sotok > 0 && <span>{formatSotok(plot.size_sotok)}</span>}
          {plot.size_sotok > 0 && plot.price_usd_per_100sqm && <span className="text-white/20">·</span>}
          {plot.price_usd_per_100sqm && <span>{formatUSD(plot.price_usd_per_100sqm)}</span>}
        </div>

        {/* Contact */}
        {plot.contact_name && (
          <p className="text-xs text-white/40 truncate">{plot.contact_name}</p>
        )}

        {/* Infrastructure dots */}
        {(plot.infra_electricity != null || plot.infra_water != null || plot.infra_gas != null || plot.infra_sewer != null) && (
          <div className="flex items-center gap-1.5">
            {([
              { val: plot.infra_electricity, icon: Zap },
              { val: plot.infra_water,       icon: Droplets },
              { val: plot.infra_gas,         icon: Flame },
              { val: plot.infra_sewer,        icon: Waves },
            ] as const).map(({ val, icon: Icon }, i) => val != null && (
              <Icon
                key={i}
                className={`w-3 h-3 ${val ? 'text-emerald-400' : 'text-white/20'}`}
              />
            ))}
          </div>
        )}

        {/* Footer: score + indicators */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2 text-white/25">
            {fileCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Paperclip className="w-3 h-3" />
                <span className="text-[10px] leading-none">{fileCount}</span>
              </span>
            )}
            {hasNotes && <AlignLeft className="w-3 h-3" />}
          </div>
          <ScoreBadge score={plot.score} size="sm" />
        </div>
      </div>
    </div>
  )
}
