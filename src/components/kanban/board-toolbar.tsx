'use client'
import { useState, useRef, useEffect } from 'react'
import { Filter, Share2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface BoardFilter {
  labels: string[]
  zone: string
  minScore: string
}

export const emptyFilter: BoardFilter = { labels: [], zone: '', minScore: '' }

export function countActive(f: BoardFilter): number {
  return (f.labels.length > 0 ? 1 : 0) + (f.zone ? 1 : 0) + (f.minScore ? 1 : 0)
}

type Member = { id: string; full_name: string | null; avatar_url: string | null }
type LabelDef = { name: string; color: string }

interface Props {
  boardName: string
  members: Member[]
  labelDefs: LabelDef[]
  filter: BoardFilter
  onFilterChange: (f: BoardFilter) => void
}

export function BoardToolbar({ boardName, members, labelDefs, filter, onFilterChange }: Props) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!filterOpen) return
      if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterOpen])

  async function copyBoardLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareCopied(true)
      toast.success('Ссылка скопирована')
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      toast.error('Не удалось скопировать')
    }
  }

  const count = countActive(filter)

  return (
    <div className="shrink-0 h-11 flex items-center gap-2 px-3 md:px-4 border-b border-border bg-[var(--sidebar)]/60 backdrop-blur">
      <h1 className="text-[15px] font-semibold text-foreground truncate">{boardName}</h1>
      <div className="flex-1" />

      {members.length > 0 && (
        <div className="flex -space-x-1.5 mr-1">
          {members.slice(0, 4).map(m => <MemberAvatar key={m.id} profile={m} />)}
          {members.length > 4 && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold bg-muted text-foreground ring-2 ring-[var(--sidebar)]">
              +{members.length - 4}
            </div>
          )}
        </div>
      )}

      <div className="relative" ref={filterRef}>
        <button
          onClick={() => setFilterOpen(o => !o)}
          className={cn(
            'flex items-center gap-1.5 h-8 px-2.5 rounded text-[13px] font-medium transition-colors',
            count > 0 ? 'bg-primary/15 text-primary hover:bg-primary/20' : 'text-foreground/80 hover:bg-white/[0.06]'
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          Фильтр
          {count > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tabular-nums">
              {count}
            </span>
          )}
        </button>
        {filterOpen && (
          <FilterPopover
            filter={filter}
            labelDefs={labelDefs}
            onChange={onFilterChange}
            onClose={() => setFilterOpen(false)}
          />
        )}
      </div>

      <button
        onClick={copyBoardLink}
        className="flex items-center gap-1.5 h-8 px-3 rounded bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-semibold transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" />
        {shareCopied ? 'Скопировано' : 'Поделиться'}
      </button>
    </div>
  )
}

function MemberAvatar({ profile }: { profile: Member }) {
  const initials = (profile.full_name ?? '?')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.full_name ?? ''}
        title={profile.full_name ?? ''}
        className="w-7 h-7 rounded-full object-cover ring-2 ring-[var(--sidebar)]"
      />
    )
  }
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-[var(--sidebar)]"
      style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
      title={profile.full_name ?? ''}
    >{initials}</div>
  )
}

function FilterPopover({
  filter,
  labelDefs,
  onChange,
  onClose,
}: {
  filter: BoardFilter
  labelDefs: LabelDef[]
  onChange: (f: BoardFilter) => void
  onClose: () => void
}) {
  function toggleLabel(name: string) {
    const next = filter.labels.includes(name)
      ? filter.labels.filter(l => l !== name)
      : [...filter.labels, name]
    onChange({ ...filter, labels: next })
  }

  return (
    <div className="absolute top-full right-0 mt-1 z-50 w-72 p-3 rounded-md shadow-xl bg-popover ring-1 ring-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-foreground">Фильтр</h4>
        <button
          onClick={onClose}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {labelDefs.length > 0 && (
        <div>
          <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Метки</h5>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {labelDefs.map(lbl => {
              const on = filter.labels.includes(lbl.name)
              return (
                <button
                  key={lbl.name}
                  onClick={() => toggleLabel(lbl.name)}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.06] text-left"
                >
                  <span className="w-10 h-2 rounded-sm shrink-0" style={{ backgroundColor: lbl.color }} />
                  <span className="flex-1 text-[13px] text-foreground/90 truncate">{lbl.name}</span>
                  {on && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Зона</h5>
        <select
          value={filter.zone}
          onChange={e => onChange({ ...filter, zone: e.target.value })}
          className="w-full bg-card border border-border rounded-md px-2 py-1 text-[13px] text-foreground outline-none focus:border-ring [&>option]:bg-popover"
        >
          <option value="">Все</option>
          <option value="Residential">Жилая</option>
          <option value="Commercial">Коммерческая</option>
          <option value="Agricultural">С/х</option>
          <option value="Mixed-use">Смешанная</option>
        </select>
      </div>

      <div>
        <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Оценка от</h5>
        <input
          type="number"
          min={0}
          max={100}
          value={filter.minScore}
          onChange={e => onChange({ ...filter, minScore: e.target.value })}
          placeholder="0–100"
          className="w-full bg-card border border-border rounded-md px-2 py-1 text-[13px] text-foreground outline-none focus:border-ring placeholder:text-muted-foreground/50"
        />
      </div>

      <button
        onClick={() => onChange(emptyFilter)}
        className="w-full h-8 rounded text-[13px] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
      >
        Сбросить фильтр
      </button>
    </div>
  )
}
