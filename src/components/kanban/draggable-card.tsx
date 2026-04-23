'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Paperclip, AlignLeft, Zap, Droplets, Flame, Waves } from 'lucide-react'
import { ScoreBadge } from '@/components/ui/score-badge'
import { formatSotok, formatUSD, cn } from '@/lib/utils'
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
        'group relative rounded-[3px] select-none cursor-pointer overflow-hidden',
        isDragging ? 'trello-tile-static' : 'trello-tile',
        isBeingDragged && 'opacity-40'
      )}
    >
      {/* Label strips — Trello collapsed label bars */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pt-2.5">
          {labels.map((lbl, i) => (
            <span
              key={i}
              className="inline-block w-10 h-2 rounded-sm"
              style={{ backgroundColor: lbl.color }}
              title={lbl.name}
            />
          ))}
        </div>
      )}

      <div className="px-3 py-2 space-y-1.5">
        {/* Title — address */}
        <p className="font-medium text-[14px] text-foreground leading-[1.35] line-clamp-3">
          {plot.address}
        </p>

        {/* Size + Price row */}
        {(plot.size_sotok > 0 || plot.price_usd_per_100sqm) && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
            {plot.size_sotok > 0 && <span>{formatSotok(plot.size_sotok)}</span>}
            {plot.size_sotok > 0 && plot.price_usd_per_100sqm && <span className="text-muted-foreground/40">·</span>}
            {plot.price_usd_per_100sqm && <span>{formatUSD(plot.price_usd_per_100sqm)}</span>}
          </div>
        )}

        {/* Contact */}
        {plot.contact_name && (
          <p className="text-[11px] text-muted-foreground truncate">{plot.contact_name}</p>
        )}

        {/* Footer: icon meta row + score */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            {(plot.infra_electricity != null || plot.infra_water != null || plot.infra_gas != null || plot.infra_sewer != null) && (
              <div className="flex items-center gap-1">
                {([
                  { val: plot.infra_electricity, icon: Zap },
                  { val: plot.infra_water,       icon: Droplets },
                  { val: plot.infra_gas,         icon: Flame },
                  { val: plot.infra_sewer,       icon: Waves },
                ] as const).map(({ val, icon: Icon }, i) => val != null && (
                  <Icon
                    key={i}
                    className={cn('w-3 h-3', val ? 'text-primary' : 'text-muted-foreground/30')}
                  />
                ))}
              </div>
            )}
            {hasNotes && <AlignLeft className="w-3 h-3" />}
            {fileCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Paperclip className="w-3 h-3" />
                <span className="text-[11px] leading-none tabular-nums">{fileCount}</span>
              </span>
            )}
          </div>
          <ScoreBadge score={plot.score} size="sm" />
        </div>
      </div>
    </div>
  )
}

