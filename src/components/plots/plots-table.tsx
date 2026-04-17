'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, X, Trash2, Zap, Droplets, Flame, Waves } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { deletePlot } from '@/actions/plots'
import { ScoreBadge } from '@/components/ui/score-badge'
import { formatSotok, formatUSD, formatDate } from '@/lib/utils'
import type { Plot, KanbanStage } from '@/types/plot'

interface Props {
  initialPlots: Plot[]
  stages: KanbanStage[]
  showArchived: boolean
}

const ZONES = [
  { value: 'Residential', label: 'Жилая' },
  { value: 'Commercial', label: 'Коммерческая' },
  { value: 'Agricultural', label: 'С/х' },
  { value: 'Mixed-use', label: 'Смешанная' },
]

export function PlotsTable({ initialPlots, stages, showArchived }: Props) {
  const [plots, setPlots] = useState<Plot[]>(initialPlots)

  // Filters
  const [q, setQ] = useState('')
  const [stageId, setStageId] = useState('')
  const [zone, setZone] = useState('')
  const [minScore, setMinScore] = useState('')
  const [maxScore, setMaxScore] = useState('')
  const [minSize, setMinSize] = useState('')
  const [maxSize, setMaxSize] = useState('')
  const [legalOnly, setLegalOnly] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Sync when parent refetches (tab switch between archived/active)
  useEffect(() => { setPlots(initialPlots) }, [initialPlots])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('plots-list-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plots' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const p = payload.new as Plot
          if (p.archived === showArchived) setPlots(prev => [p, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          const p = payload.new as Plot
          if (p.archived === showArchived) {
            setPlots(prev => {
              const idx = prev.findIndex(x => x.id === p.id)
              if (idx >= 0) { const copy = [...prev]; copy[idx] = p; return copy }
              return [p, ...prev]
            })
          } else {
            // Plot left this view (e.g. got archived while on active tab)
            setPlots(prev => prev.filter(x => x.id !== p.id))
          }
        } else if (payload.eventType === 'DELETE') {
          setPlots(prev => prev.filter(x => x.id !== (payload.old as Plot).id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [showArchived])

  const hasFilter = q || stageId || zone || minScore || maxScore || minSize || maxSize || legalOnly || dateFrom || dateTo

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    const from = dateFrom ? new Date(dateFrom).getTime() : null
    const to = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null
    return plots.filter(p => {
      if (ql && !p.address.toLowerCase().includes(ql) && !(p.contact_name ?? '').toLowerCase().includes(ql)) return false
      if (stageId && p.stage_id !== stageId) return false
      if (zone && p.zone !== zone) return false
      if (minScore && (p.score ?? 0) < parseInt(minScore)) return false
      if (maxScore && (p.score ?? 0) > parseInt(maxScore)) return false
      if (minSize && (p.size_sotok ?? 0) < parseFloat(minSize)) return false
      if (maxSize && (p.size_sotok ?? 0) > parseFloat(maxSize)) return false
      if (legalOnly && !p.legal_clearance) return false
      if (from && new Date(p.created_at).getTime() < from) return false
      if (to && new Date(p.created_at).getTime() > to) return false
      return true
    })
  }, [plots, q, stageId, zone, minScore, maxScore, minSize, maxSize, legalOnly])

  function clearFilters() {
    setQ(''); setStageId(''); setZone('')
    setMinScore(''); setMaxScore('')
    setMinSize(''); setMaxSize('')
    setLegalOnly(false)
    setDateFrom(''); setDateTo('')
  }

  async function handleDelete(plot: Plot) {
    if (!confirm(`Удалить "${plot.address}" навсегда?`)) return
    setDeletingId(plot.id)
    try {
      await deletePlot(plot.id)
      setPlots(prev => prev.filter(p => p.id !== plot.id))
      toast.success('Участок удалён')
    } catch {
      toast.error('Ошибка удаления')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Address search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Адрес или контакт..."
            className="pl-8 pr-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 outline-none focus:border-indigo-500/50 w-56"
          />
        </div>

        {/* Stage */}
        <select value={stageId} onChange={e => setStageId(e.target.value)} className={selectCls}>
          <option value="">Все стадии</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        {/* Zone */}
        <select value={zone} onChange={e => setZone(e.target.value)} className={selectCls}>
          <option value="">Все зоны</option>
          {ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
        </select>

        {/* Size range */}
        <div className="flex items-center gap-1">
          <input
            value={minSize}
            onChange={e => setMinSize(e.target.value)}
            type="number" min="0" step="0.1"
            placeholder="Сот. от"
            className={`${selectCls} w-24`}
          />
          <span className="text-white/20 text-xs">—</span>
          <input
            value={maxSize}
            onChange={e => setMaxSize(e.target.value)}
            type="number" min="0" step="0.1"
            placeholder="до"
            className={`${selectCls} w-20`}
          />
        </div>

        {/* Score range */}
        <div className="flex items-center gap-1">
          <input
            value={minScore}
            onChange={e => setMinScore(e.target.value)}
            type="number" min="0" max="100"
            placeholder="Оц. от"
            className={`${selectCls} w-22`}
          />
          <span className="text-white/20 text-xs">—</span>
          <input
            value={maxScore}
            onChange={e => setMaxScore(e.target.value)}
            type="number" min="0" max="100"
            placeholder="до"
            className={`${selectCls} w-16`}
          />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className={`${selectCls} w-36`}
            title="Добавлен с"
          />
          <span className="text-white/20 text-xs">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className={`${selectCls} w-36`}
            title="Добавлен по"
          />
        </div>

        {/* Legal clearance */}
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={legalOnly}
            onChange={e => setLegalOnly(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-indigo-500"
          />
          <span className="text-xs text-white/50">Красная книга</span>
        </label>

        {hasFilter && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-white/40 hover:text-white/70 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Сбросить
          </button>
        )}
      </div>

      {/* Result count */}
      {hasFilter && (
        <p className="text-xs text-white/30">
          Показано: {filtered.length} из {plots.length}
        </p>
      )}

      {/* Table */}
      <div className="bg-[#142a50] border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            <tr>
              <th className="text-left px-4 py-3 font-medium text-white/40 text-xs uppercase tracking-wide">Адрес</th>
              <th className="text-left px-4 py-3 font-medium text-white/40 text-xs uppercase tracking-wide">Площадь</th>
              <th className="text-left px-4 py-3 font-medium text-white/40 text-xs uppercase tracking-wide">Цена / 100м²</th>
              <th className="text-left px-4 py-3 font-medium text-white/40 text-xs uppercase tracking-wide">Доля</th>
              <th className="text-left px-4 py-3 font-medium text-white/40 text-xs uppercase tracking-wide">Стадия</th>
              <th className="text-left px-4 py-3 font-medium text-white/40 text-xs uppercase tracking-wide">Инфра</th>
              <th className="text-left px-4 py-3 font-medium text-white/40 text-xs uppercase tracking-wide">Оценка</th>
              <th className="text-left px-4 py-3 font-medium text-white/40 text-xs uppercase tracking-wide">Добавлен</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-white/30">
                  {hasFilter ? 'Нет результатов по фильтрам' : showArchived ? 'Нет архивных участков' : 'Нет участков. Добавьте первый!'}
                </td>
              </tr>
            )}
            {filtered.map(plot => {
              const stage = stages.find(s => s.id === plot.stage_id) ?? null
              return (
                <tr key={plot.id} className="group border-t border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/plots/${plot.id}`} className="font-medium text-white/80 hover:text-indigo-400 transition-colors">
                      {plot.address}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/50">{formatSotok(plot.size_sotok)}</td>
                  <td className="px-4 py-3 text-white/50">{formatUSD(plot.price_usd_per_100sqm)}</td>
                  <td className="px-4 py-3 text-white/50">{plot.owner_share_pct}%</td>
                  <td className="px-4 py-3">
                    {stage ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: stage.color }}>
                        {stage.name}
                      </span>
                    ) : <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {([
                        { val: plot.infra_electricity, icon: Zap },
                        { val: plot.infra_water,       icon: Droplets },
                        { val: plot.infra_gas,         icon: Flame },
                        { val: plot.infra_sewer,        icon: Waves },
                      ] as const).map(({ val, icon: Icon }, i) => (
                        <Icon key={i} className={`w-3.5 h-3.5 ${val === true ? 'text-emerald-400' : val === false ? 'text-white/15' : 'text-white/10'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3"><ScoreBadge score={plot.score} size="sm" /></td>
                  <td className="px-4 py-3 text-white/30">{formatDate(plot.created_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(plot)}
                      disabled={deletingId === plot.id}
                      className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 opacity-0 group-hover:opacity-100"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const selectCls = 'px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white/60 outline-none focus:border-indigo-500/50 [&>option]:bg-[#112545]'
