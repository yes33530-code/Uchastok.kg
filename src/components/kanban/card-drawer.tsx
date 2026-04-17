'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { X, ChevronDown, ChevronUp, Archive, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { updatePlot, archivePlot, deletePlot, saveScoringInputs } from '@/actions/plots'
import { moveToStage } from '@/actions/stages'
import { ProfitCalculator } from '@/components/calculator/profit-calculator'
import { FileAttachments } from '@/components/plots/file-attachments'
import { ChecklistPanel } from '@/components/automations/checklist-panel'
import { ActivityPanel } from '@/components/plots/activity-panel'
import { ScoreBadge } from '@/components/ui/score-badge'
import { formatDate } from '@/lib/utils'
import type { Plot, KanbanStage, PlotFile, PlotChecklist, CalculatorSnapshot, ScoringInputs } from '@/types/plot'

interface Props {
  plotId: string
  stages: KanbanStage[]
  userId: string
  onClose: () => void
  onPlotUpdate?: (plot: Plot) => void
  onPlotRemove?: (plotId: string) => void
}

const INFRA_UTILITIES = [
  { key: 'light', label: 'Свет',        icon: '⚡', dbField: 'infra_electricity' },
  { key: 'water', label: 'Вода',        icon: '💧', dbField: 'infra_water' },
  { key: 'gas',   label: 'Газ',         icon: '🔥', dbField: 'infra_gas' },
  { key: 'sewer', label: 'Канализация', icon: '🪣', dbField: 'infra_sewer' },
] as const

type InfraKey = typeof INFRA_UTILITIES[number]['key']

function infraToScore(checked: Set<InfraKey>): number {
  return checked.size * 25
}

/** Build checked set from plot's boolean fields */
function plotToInfra(plot: Plot): Set<InfraKey> {
  const s = new Set<InfraKey>()
  if (plot.infra_electricity) s.add('light')
  if (plot.infra_water)       s.add('water')
  if (plot.infra_gas)         s.add('gas')
  if (plot.infra_sewer)       s.add('sewer')
  return s
}

const ZONES = [
  { value: '', label: '— Зона —' },
  { value: 'Residential', label: 'Жилая' },
  { value: 'Commercial', label: 'Коммерческая' },
  { value: 'Agricultural', label: 'С/х' },
  { value: 'Mixed-use', label: 'Смешанная' },
]

const LABEL_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#10b981',
  '#3b82f6', '#06b6d4', '#64748b', '#ffffff',
]

type LabelItem = { name: string; color: string }

type Fields = {
  address: string
  size_sotok: string
  price_usd_per_100sqm: string
  owner_share_pct: string
  contact: string
  project_duration_months: string
  legal_clearance: boolean
  zone: string
  notes: string
}

type ScoringVals = {
  location_quality: number
  infrastructure_score: number
  price_vs_market_pct: number
  buildout_potential: number
}

export function CardDrawer({ plotId, stages, userId, onClose, onPlotUpdate, onPlotRemove }: Props) {
  const [plot, setPlot] = useState<Plot | null>(null)
  const [snapshot, setSnapshot] = useState<CalculatorSnapshot | null>(null)
  const [files, setFiles] = useState<PlotFile[]>([])
  const [checklists, setChecklists] = useState<PlotChecklist[]>([])
  const [loading, setLoading] = useState(true)
  const [stageOpen, setStageOpen] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)
  const [fields, setFields] = useState<Fields | null>(null)
  const [labels, setLabels] = useState<LabelItem[]>([])
  const [globalLabels, setGlobalLabels] = useState<LabelItem[]>([])
  const [labelInput, setLabelInput] = useState('')
  const [labelColor, setLabelColor] = useState(LABEL_COLORS[0])
  const [labelPickerOpen, setLabelPickerOpen] = useState(false)
  const [scoringVals, setScoringVals] = useState<ScoringVals>({
    location_quality: 50,
    infrastructure_score: 50,
    price_vs_market_pct: 0,
    buildout_potential: 50,
  })
  const [infraChecked, setInfraChecked] = useState<Set<InfraKey>>(new Set())
  const [archiving, setArchiving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scoringTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const plotRef = useRef<Plot | null>(null)

  useEffect(() => { plotRef.current = plot }, [plot])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const [{ data: p }, { data: snap }, { data: f }, { data: cl }, { data: si }, { data: gl }] = await Promise.all([
        supabase.from('plots').select('*').eq('id', plotId).single(),
        supabase.from('calculator_snapshots').select('*').eq('plot_id', plotId).maybeSingle(),
        supabase.from('plot_files').select('*').eq('plot_id', plotId).order('created_at'),
        supabase.from('plot_checklists').select('*').eq('plot_id', plotId).order('created_at'),
        supabase.from('scoring_inputs').select('*').eq('plot_id', plotId).maybeSingle(),
        supabase.from('label_definitions').select('name,color').order('created_at'),
      ])
      if (p) {
        setPlot(p)
        const contactParts = [p.contact_name, p.contact_phone, p.contact_email].filter(Boolean)
        setFields({
          address: p.address,
          size_sotok: String(p.size_sotok),
          price_usd_per_100sqm: p.price_usd_per_100sqm != null ? String(p.price_usd_per_100sqm) : '',
          owner_share_pct: String(p.owner_share_pct),
          contact: contactParts.join(', '),
          project_duration_months: p.project_duration_months != null ? String(p.project_duration_months) : '',
          legal_clearance: p.legal_clearance,
          zone: p.zone ?? '',
          notes: p.notes ?? '',
        })
        // Parse labels from jsonb
        try {
          const raw = p.labels
          if (Array.isArray(raw)) setLabels(raw as LabelItem[])
        } catch { /* ignore */ }
      }
      setSnapshot(snap ?? null)
      setFiles(f ?? [])
      setChecklists(cl ?? [])
      if (gl) setGlobalLabels(gl as LabelItem[])
      if (si) {
        setScoringVals({
          location_quality: si.location_quality ?? 50,
          infrastructure_score: si.infrastructure_score ?? 50,
          price_vs_market_pct: si.price_vs_market_pct ?? 0,
          buildout_potential: si.buildout_potential ?? 50,
        })
      }
      if (p) {
        setInfraChecked(plotToInfra(p))
      }
      setLoading(false)
    }
    load()
  }, [plotId])

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const doSave = useCallback(async (f: Fields, p: Plot, lbls: LabelItem[]) => {
    try {
      await updatePlot(p.id, {
        address: f.address,
        size_sotok: parseFloat(f.size_sotok) || 0,
        price_usd_per_100sqm: f.price_usd_per_100sqm ? parseFloat(f.price_usd_per_100sqm) : null,
        owner_share_pct: parseFloat(f.owner_share_pct) || 0,
        contact_name: f.contact || null,
        contact_phone: null,
        contact_email: null,
        project_duration_months: f.project_duration_months ? parseInt(f.project_duration_months) : null,
        legal_clearance: f.legal_clearance,
        zone: (f.zone as Plot['zone']) || null,
        notes: f.notes || null,
        labels: lbls as unknown as Plot['labels'],
      })
      const supabase = createClient()
      const { data: updated } = await supabase.from('plots').select('*').eq('id', p.id).single()
      if (updated) { setPlot(updated); onPlotUpdate?.(updated) }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка автосохранения')
    }
  }, [onPlotUpdate])

  const labelsRef = useRef<LabelItem[]>(labels)
  useEffect(() => { labelsRef.current = labels }, [labels])

  function setField<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields(prev => {
      if (!prev) return prev
      const next = { ...prev, [key]: value }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        if (plotRef.current) doSave(next, plotRef.current, labelsRef.current)
      }, 1500)
      return next
    })
  }

  function triggerSave(f: Fields, lbls: LabelItem[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (plotRef.current) doSave(f, plotRef.current, lbls)
    }, 1500)
  }

  async function addLabel(picked?: LabelItem) {
    const lbl: LabelItem = picked ?? (labelInput.trim() ? { name: labelInput.trim(), color: labelColor } : null!)
    if (!lbl) return
    const next = [...labels, lbl]
    setLabels(next)
    setLabelInput('')
    setLabelPickerOpen(false)
    if (fields && plotRef.current) triggerSave(fields, next)
    // Save to global definitions if new
    const alreadyGlobal = globalLabels.some(g => g.name === lbl.name && g.color === lbl.color)
    if (!alreadyGlobal) {
      const supabase = createClient()
      const { data } = await supabase.from('label_definitions').insert({ name: lbl.name, color: lbl.color }).select('name,color').single()
      if (data) setGlobalLabels(prev => [...prev, data as LabelItem])
    }
  }

  function removeLabel(idx: number) {
    const next = labels.filter((_, i) => i !== idx)
    setLabels(next)
    if (fields && plotRef.current) triggerSave(fields, next)
  }

  async function handleStageChange(stageId: string) {
    if (!plot) return
    setStageOpen(false)
    try {
      await moveToStage(plot.id, stageId)
      const updated = { ...plot, stage_id: stageId }
      setPlot(updated)
      onPlotUpdate?.(updated)
    } catch { toast.error('Ошибка смены стадии') }
  }

  async function handleArchive() {
    if (!plot) return
    if (!window.confirm('Переместить участок в архив?')) return
    setArchiving(true)
    try {
      await archivePlot(plot.id)
      onPlotRemove?.(plot.id)
      onClose()
      toast.success('Участок перемещён в архив')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
      setArchiving(false)
    }
  }

  async function handleDelete() {
    if (!plot) return
    if (!window.confirm('Удалить участок навсегда? Это действие нельзя отменить.')) return
    setDeleting(true)
    try {
      await deletePlot(plot.id)
      onPlotRemove?.(plot.id)
      onClose()
      toast.success('Участок удалён')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
      setDeleting(false)
    }
  }

  // Autosave scoring 1s after change
  const plotIdForScoring = plot?.id
  useEffect(() => {
    if (!plotIdForScoring) return
    if (scoringTimer.current) clearTimeout(scoringTimer.current)
    scoringTimer.current = setTimeout(async () => {
      try {
        await saveScoringInputs(plotIdForScoring, scoringVals)
        const supabase = createClient()
        const { data: updated } = await supabase.from('plots').select('*').eq('id', plotIdForScoring).single()
        if (updated) { setPlot(updated); onPlotUpdate?.(updated) }
      } catch { /* silent */ }
    }, 1000)
    return () => { if (scoringTimer.current) clearTimeout(scoringTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoringVals, plotIdForScoring])

  const currentStage = stages.find(s => s.id === plot?.stage_id)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-start justify-center md:pt-6 md:pb-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="rounded-t-2xl md:rounded-xl shadow-2xl w-full md:max-w-5xl md:mx-4 md:mb-6 md:max-h-[90dvh] flex flex-col"
        style={{ backgroundColor: '#112545', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {loading ? (
          <div className="p-16 text-center text-white/30 text-sm">Загрузка...</div>
        ) : !plot || !fields ? (
          <div className="p-16 text-center text-red-400 text-sm">Ошибка загрузки</div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {/* Stage picker */}
              <div className="relative">
                <button
                  onClick={() => setStageOpen(o => !o)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: currentStage?.color ?? '#6b7280' }}
                >
                  {currentStage?.name ?? 'Без стадии'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {stageOpen && (
                  <div className="absolute top-full left-0 mt-1 rounded-xl shadow-xl z-20 min-w-[200px] py-1" style={{ backgroundColor: '#142a50', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {stages.map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleStageChange(s.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/80 hover:bg-white/5 text-left"
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <ScoreBadge score={plot.score} size="sm" />
                <span className="text-xs text-white/30">{formatDate(plot.created_at)}</span>

                {/* Archive */}
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  title="В архив"
                  className="p-1.5 rounded-lg text-white/40 hover:text-amber-400 hover:bg-white/5 transition-colors disabled:opacity-40"
                >
                  <Archive className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  title="Удалить"
                  className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors ml-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body — two-column on desktop */}
            <div className="flex flex-col md:flex-row md:overflow-hidden flex-1 min-h-0">
            {/* ── Left column: main content ── */}
            <div className="flex-1 min-w-0 px-5 py-4 space-y-4 overflow-y-auto max-h-[80dvh] md:max-h-none">
              {/* Title */}
              <input
                value={fields.address}
                onChange={e => setField('address', e.target.value)}
                className="w-full text-xl font-bold text-white bg-transparent border-0 outline-none focus:bg-white/5 rounded-lg px-2 py-1 -mx-2 transition-colors placeholder-white/20"
                placeholder="Адрес участка"
              />

              {/* Labels */}
              <div className="flex flex-wrap gap-1.5 items-center">
                {labels.map((lbl, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full text-white"
                    style={{ backgroundColor: lbl.color + '33', border: `1px solid ${lbl.color}66`, color: lbl.color }}
                  >
                    {lbl.name}
                    <button
                      onClick={() => removeLabel(idx)}
                      className="opacity-60 hover:opacity-100 ml-0.5"
                    >×</button>
                  </span>
                ))}
                <div className="relative">
                  <button
                    onClick={() => setLabelPickerOpen(o => !o)}
                    className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 px-2 py-1 rounded-full border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Метка
                  </button>
                  {labelPickerOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 z-20 p-3 rounded-xl shadow-xl w-64"
                      style={{ backgroundColor: '#142a50', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {/* Existing global labels */}
                      {globalLabels.filter(g => !labels.some(l => l.name === g.name && l.color === g.color)).length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-white/30 mb-1.5">Сохранённые метки</p>
                          <div className="flex flex-wrap gap-1">
                            {globalLabels
                              .filter(g => !labels.some(l => l.name === g.name && l.color === g.color))
                              .map((g, i) => (
                                <button
                                  key={i}
                                  onClick={() => addLabel(g)}
                                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium transition-opacity hover:opacity-80"
                                  style={{ backgroundColor: g.color + '33', border: `1px solid ${g.color}66`, color: g.color }}
                                >
                                  {g.name}
                                </button>
                              ))
                            }
                          </div>
                          <div className="my-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />
                        </div>
                      )}
                      <input
                        autoFocus
                        value={labelInput}
                        onChange={e => setLabelInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addLabel()}
                        placeholder="Новая метка..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/25 mb-2"
                      />
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {LABEL_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setLabelColor(c)}
                            className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                            style={{ backgroundColor: c, outline: labelColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => addLabel()}
                        className="w-full text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg py-1.5 font-medium transition-colors"
                      >
                        Создать метку
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Plot info grid — simplified */}
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wide mb-3">Информация</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <DField label="Площадь (сотки)">
                    <input type="number" step="0.01" value={fields.size_sotok} onChange={e => setField('size_sotok', e.target.value)} className={inputCls} />
                  </DField>
                  <DField label="Цена (USD / 100 м²)">
                    <input type="number" step="0.01" value={fields.price_usd_per_100sqm} onChange={e => setField('price_usd_per_100sqm', e.target.value)} className={inputCls} placeholder="—" />
                  </DField>
                  <div className="col-span-2">
                    <DField label="Контакт">
                      <input value={fields.contact} onChange={e => setField('contact', e.target.value)} className={inputCls} placeholder="Имя, телефон, email..." />
                    </DField>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="drawer_lc"
                      checked={fields.legal_clearance}
                      onChange={e => setField('legal_clearance', e.target.checked)}
                      className="w-4 h-4 rounded accent-indigo-500"
                    />
                    <label htmlFor="drawer_lc" className="text-sm text-white/60">Красная книга (право собственности)</label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wide mb-2">Описание</h4>
                <textarea
                  value={fields.notes}
                  onChange={e => setField('notes', e.target.value)}
                  rows={3}
                  placeholder="Заметки, условия..."
                  className="w-full text-sm text-white/80 border-0 outline-none resize-none placeholder-white/20 bg-transparent"
                />
              </div>

              {/* Calculator + Scoring — collapsible */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <button
                  onClick={() => setCalcOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                >
                  <span className="text-sm font-semibold text-white/80">Калькулятор доходности</span>
                  {calcOpen
                    ? <ChevronUp className="w-4 h-4 text-white/40" />
                    : <ChevronDown className="w-4 h-4 text-white/40" />
                  }
                </button>
                {calcOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* Profit calculator */}
                    <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <ProfitCalculator
                        plotId={plot.id}
                        ownerSharePct={parseFloat(fields.owner_share_pct) || 0}
                        durationMonths={fields.project_duration_months ? parseInt(fields.project_duration_months) : null}
                        snapshot={snapshot as any}
                        userId={userId}
                        dark
                      />
                    </div>
                    {/* Scoring inputs — below calculator */}
                    <div className="p-4">
                      <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wide mb-3">Параметры оценки</h4>
                      <div className="space-y-3">
                        <DField label="Тип зоны">
                          <select value={fields.zone} onChange={e => setField('zone', e.target.value)} className={inputCls}>
                            {ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                          </select>
                        </DField>
                        <DSlider label="Качество локации" value={scoringVals.location_quality} onChange={v => setScoringVals(s => ({ ...s, location_quality: v }))} min={0} max={100} />
                        <DSlider label="Потенциал застройки" value={scoringVals.buildout_potential} onChange={v => setScoringVals(s => ({ ...s, buildout_potential: v }))} min={0} max={100} />
                        {/* Infrastructure — 4 utility toggles (below other sliders) */}
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-xs text-white/40">Инфраструктура</label>
                            <span className="text-xs font-medium text-white/70">{infraChecked.size}/4</span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {INFRA_UTILITIES.map(u => {
                              const on = infraChecked.has(u.key)
                              return (
                                <button
                                  key={u.key}
                                  type="button"
                                  onClick={async () => {
                                    const next = new Set(infraChecked)
                                    if (on) next.delete(u.key); else next.add(u.key)
                                    setInfraChecked(next)
                                    setScoringVals(s => ({ ...s, infrastructure_score: infraToScore(next) }))
                                    if (plotRef.current) {
                                      await updatePlot(plotRef.current.id, {
                                        infra_electricity: next.has('light'),
                                        infra_water:       next.has('water'),
                                        infra_gas:         next.has('gas'),
                                        infra_sewer:       next.has('sewer'),
                                      })
                                      const { data: updated } = await createClient().from('plots').select('*').eq('id', plotRef.current.id).single()
                                      if (updated) { setPlot(updated); onPlotUpdate?.(updated) }
                                    }
                                  }}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                                  style={{
                                    backgroundColor: on ? 'rgba(99,102,241,0.25)' : 'rgba(0,0,0,0.35)',
                                    border: on ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.08)',
                                    color: on ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                                  }}
                                >
                                  <span>{u.icon}</span>
                                  {u.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-xs text-white/40">Цена vs рынок (% — отриц. = ниже рынка)</label>
                            <span className="text-xs font-medium text-white/70">{scoringVals.price_vs_market_pct}</span>
                          </div>
                          <input
                            type="number"
                            step="0.5"
                            value={scoringVals.price_vs_market_pct}
                            onChange={e => setScoringVals(s => ({ ...s, price_vs_market_pct: parseFloat(e.target.value) || 0 }))}
                            className={inputCls}
                          />
                        </div>
                        <p className="text-xs text-white/20 text-right">Сохраняется автоматически</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* File attachments */}
              <FileAttachments plotId={plot.id} initialFiles={files} dark />

              {/* Checklists */}
              {checklists.length > 0 && (
                <ChecklistPanel checklists={checklists} userId={userId} />
              )}
            </div>{/* end left column */}

            {/* ── Vertical divider ── */}
            <div className="hidden md:block shrink-0 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
            {/* Mobile horizontal divider */}
            <div className="md:hidden h-px mx-5" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />

            {/* ── Right column: activity & comments ── */}
            <div className="md:w-72 lg:w-80 shrink-0 flex flex-col md:overflow-hidden">
              <ActivityPanel plotId={plot.id} userId={userId} sidebar />
            </div>

            </div>{/* end two-column body */}
          </>
        )}
      </div>
    </div>
  )
}

function DField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/30 mb-1">{label}</label>
      {children}
    </div>
  )
}

function DSlider({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs text-white/40">{label}</label>
        <span className="text-xs font-medium text-white/70">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full accent-indigo-500"
      />
    </div>
  )
}

const inputCls = 'w-full rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 bg-black/50 border border-white/8 focus:border-indigo-500/50'
