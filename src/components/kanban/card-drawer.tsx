'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { X, ChevronDown, ChevronUp, Archive, Trash2, Plus, Zap, Droplets, Flame, Waves, CreditCard, Tag, Paperclip, MoveRight, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { updatePlot, archivePlot, deletePlot, saveScoringInputs } from '@/actions/plots'
import { moveToStage } from '@/actions/stages'
import { ProfitCalculator } from '@/components/calculator/profit-calculator'
import { FileAttachments } from '@/components/plots/file-attachments'
import { ChecklistPanel } from '@/components/automations/checklist-panel'
import { ActivityPanel } from '@/components/plots/activity-panel'
import { ScoreBadge } from '@/components/ui/score-badge'
import { formatDate, cn } from '@/lib/utils'
import type { Plot, KanbanStage, PlotFile, PlotChecklist, CalculatorSnapshot } from '@/types/plot'

interface Props {
  plotId: string
  stages: KanbanStage[]
  userId: string
  onClose: () => void
  onPlotUpdate?: (plot: Plot) => void
  onPlotRemove?: (plotId: string) => void
}

const INFRA_UTILITIES = [
  { key: 'light', label: 'Свет',        icon: Zap,      dbField: 'infra_electricity' },
  { key: 'water', label: 'Вода',        icon: Droplets, dbField: 'infra_water' },
  { key: 'gas',   label: 'Газ',         icon: Flame,    dbField: 'infra_gas' },
  { key: 'sewer', label: 'Канализация', icon: Waves,    dbField: 'infra_sewer' },
] as const

type InfraKey = typeof INFRA_UTILITIES[number]['key']

function infraToScore(checked: Set<InfraKey>): number {
  return checked.size * 25
}

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
  '#0F766E', '#0369A1', '#14B8A6', '#9F8FEF',
  '#F97316', '#EAB308', '#22C55E', '#10B981',
  '#EC4899', '#DC2626', '#64748B', '#FFFFFF',
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-4 pb-4 md:pt-10 md:pb-10 bg-black/70 backdrop-blur-[2px] overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-4xl md:mx-4 rounded-lg shadow-2xl bg-card ring-1 ring-white/[0.08] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-16 text-center text-muted-foreground text-sm">Загрузка...</div>
        ) : !plot || !fields ? (
          <div className="p-16 text-center text-destructive text-sm">Ошибка загрузки</div>
        ) : (
          <>
            {/* Header — title + subtitle + actions */}
            <div className="relative px-6 pt-5 pb-4">
              <div className="absolute top-4 right-4 flex items-center gap-0.5">
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  title="В архив"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  title="Удалить"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-border mx-1" />
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-start gap-3 pr-32">
                <CreditCard className="w-5 h-5 text-muted-foreground mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <input
                    value={fields.address}
                    onChange={e => setField('address', e.target.value)}
                    className="w-full text-[20px] font-semibold text-foreground bg-transparent border-0 outline-none focus:bg-muted rounded-md px-2 py-1 -mx-2 transition-colors placeholder:text-muted-foreground/50 leading-tight"
                    placeholder="Адрес участка"
                  />
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    в колонке{' '}
                    <button
                      onClick={() => setStageOpen(o => !o)}
                      className="relative inline-flex items-center gap-1 underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 hover:text-foreground transition-colors"
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: currentStage?.color ?? 'var(--muted-foreground)' }}
                      />
                      {currentStage?.name ?? 'Без стадии'}
                    </button>
                    {stageOpen && (
                      <span className="absolute z-30">
                        <span className="fixed inset-0" onClick={() => setStageOpen(false)} />
                        <span className="relative block mt-1 rounded-md shadow-xl min-w-[200px] py-1 bg-popover ring-1 ring-white/10">
                          {stages.map(s => (
                            <button
                              key={s.id}
                              onClick={() => handleStageChange(s.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-foreground hover:bg-muted text-left transition-colors"
                            >
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                              {s.name}
                            </button>
                          ))}
                        </span>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Body — main + action sidebar */}
            <div className="flex flex-col md:flex-row max-h-[calc(90dvh-5.5rem)] md:overflow-hidden">
              {/* ── Main column ── */}
              <div className="flex-1 min-w-0 px-6 pb-6 pt-1 space-y-5 md:overflow-y-auto">
                {/* Action chip row — Trello card-back top actions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <ChipBtn icon={Tag} onClick={() => setLabelPickerOpen(o => !o)}>Метка</ChipBtn>
                  <ChipBtn
                    icon={Paperclip}
                    onClick={() => document.getElementById('attachments')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  >Файл</ChipBtn>
                  <ChipBtn icon={MoveRight} onClick={() => setStageOpen(o => !o)}>Переместить</ChipBtn>
                </div>

                {/* Metadata row: labels + score + date */}
                <div className="flex flex-wrap gap-4 items-start">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Метки</h4>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {labels.length === 0 && (
                        <span className="text-[12px] text-muted-foreground/60">—</span>
                      )}
                      {labels.map((lbl, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold h-6 px-2 rounded"
                          style={{ backgroundColor: lbl.color, color: readableInk(lbl.color) }}
                        >
                          {lbl.name}
                          <button
                            onClick={() => removeLabel(idx)}
                            className="opacity-70 hover:opacity-100 ml-0.5 leading-none"
                            aria-label="Удалить метку"
                          >×</button>
                        </span>
                      ))}
                      <div className="relative">
                        <button
                          onClick={() => setLabelPickerOpen(o => !o)}
                          className="inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
                          title="Добавить метку"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        {labelPickerOpen && (
                          <div className="absolute top-full left-0 mt-1.5 z-20 p-3 rounded-md shadow-xl w-64 bg-popover ring-1 ring-white/10">
                            {globalLabels.filter(g => !labels.some(l => l.name === g.name && l.color === g.color)).length > 0 && (
                              <div className="mb-2">
                                <p className="text-[11px] text-muted-foreground mb-1.5 uppercase tracking-wide font-semibold">Сохранённые</p>
                                <div className="flex flex-wrap gap-1">
                                  {globalLabels
                                    .filter(g => !labels.some(l => l.name === g.name && l.color === g.color))
                                    .map((g, i) => (
                                      <button
                                        key={i}
                                        onClick={() => addLabel(g)}
                                        className="text-[11px] px-2 h-5 rounded font-semibold transition-opacity hover:opacity-80"
                                        style={{ backgroundColor: g.color, color: readableInk(g.color) }}
                                      >
                                        {g.name}
                                      </button>
                                    ))
                                  }
                                </div>
                                <div className="my-2 border-t border-border" />
                              </div>
                            )}
                            <input
                              autoFocus
                              value={labelInput}
                              onChange={e => setLabelInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && addLabel()}
                              placeholder="Новая метка..."
                              className={inputCls + ' mb-2'}
                            />
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {LABEL_COLORS.map(c => (
                                <button
                                  key={c}
                                  onClick={() => setLabelColor(c)}
                                  className="w-5 h-5 rounded-sm transition-transform hover:scale-110 border border-border"
                                  style={{ backgroundColor: c, outline: labelColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                                />
                              ))}
                            </div>
                            <button
                              onClick={() => addLabel()}
                              className="w-full text-xs text-primary-foreground bg-primary hover:bg-primary/90 rounded-md py-1.5 font-medium transition-colors"
                            >
                              Создать метку
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Оценка</h4>
                    <ScoreBadge score={plot.score} size="sm" />
                  </div>
                  <div className="shrink-0">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Добавлен</h4>
                    <p className="text-[13px] text-foreground tabular-nums">{formatDate(plot.created_at)}</p>
                  </div>
                </div>

                {/* Details — plot info grid */}
                <section>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Детали</h4>
                  <div className="rounded-md p-4 bg-[var(--list)]/60 border border-border">
                    <div className="grid grid-cols-2 gap-x-5 gap-y-3">
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
                          className="w-4 h-4 rounded accent-primary"
                        />
                        <label htmlFor="drawer_lc" className="text-[13px] text-foreground/80">Красная книга (право собственности)</label>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Description */}
                <section>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Описание</h4>
                  <div className="rounded-md p-3 bg-[var(--list)]/60 border border-border">
                    <textarea
                      value={fields.notes}
                      onChange={e => setField('notes', e.target.value)}
                      rows={3}
                      placeholder="Заметки, условия..."
                      className="w-full text-[13px] text-foreground border-0 outline-none resize-none placeholder:text-muted-foreground/50 bg-transparent"
                    />
                  </div>
                </section>

                {/* Calculator + Scoring — collapsible */}
                <section>
                  <div className="rounded-md overflow-hidden border border-border">
                    <button
                      onClick={() => setCalcOpen(o => !o)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--list)]/60 hover:bg-[var(--list)]/90 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                        <Calculator className="w-4 h-4 text-muted-foreground" />
                        Калькулятор доходности
                      </span>
                      {calcOpen
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      }
                    </button>
                    {calcOpen && (
                      <div className="border-t border-border">
                        <div className="p-4 border-b border-border">
                          <ProfitCalculator
                            plotId={plot.id}
                            ownerSharePct={parseFloat(fields.owner_share_pct) || 0}
                            durationMonths={fields.project_duration_months ? parseInt(fields.project_duration_months) : null}
                            snapshot={snapshot as Omit<import('@/types/plot').CalculatorSnapshot, 'id' | 'plot_id' | 'updated_at'> | null}
                            userId={userId}
                          />
                        </div>
                        <div className="p-4">
                          <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Параметры оценки</h5>
                          <div className="space-y-3">
                            <DField label="Тип зоны">
                              <select value={fields.zone} onChange={e => setField('zone', e.target.value)} className={inputCls}>
                                {ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                              </select>
                            </DField>
                            <DSlider label="Качество локации" value={scoringVals.location_quality} onChange={v => setScoringVals(s => ({ ...s, location_quality: v }))} min={0} max={100} />
                            <DSlider label="Потенциал застройки" value={scoringVals.buildout_potential} onChange={v => setScoringVals(s => ({ ...s, buildout_potential: v }))} min={0} max={100} />
                            <div>
                              <div className="flex justify-between mb-2">
                                <label className="text-xs text-muted-foreground">Инфраструктура</label>
                                <span className="text-xs font-medium text-foreground tabular-nums">{infraChecked.size}/4</span>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {INFRA_UTILITIES.map(u => {
                                  const on = infraChecked.has(u.key)
                                  const Icon = u.icon
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
                                      className={cn(
                                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border',
                                        on
                                          ? 'bg-accent/10 border-accent/40 text-accent'
                                          : 'bg-card border-border text-muted-foreground hover:border-ring/60'
                                      )}
                                    >
                                      <Icon className="w-3.5 h-3.5" />
                                      {u.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <label className="text-xs text-muted-foreground">Цена vs рынок (% — отриц. = ниже рынка)</label>
                                <span className="text-xs font-medium text-foreground tabular-nums">{scoringVals.price_vs_market_pct}</span>
                              </div>
                              <input
                                type="number"
                                step="0.5"
                                value={scoringVals.price_vs_market_pct}
                                onChange={e => setScoringVals(s => ({ ...s, price_vs_market_pct: parseFloat(e.target.value) || 0 }))}
                                className={inputCls}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground/70 text-right">Сохраняется автоматически</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* File attachments */}
                <section id="attachments">
                  <FileAttachments plotId={plot.id} initialFiles={files} />
                </section>

                {/* Checklists */}
                {checklists.length > 0 && (
                  <section>
                    <ChecklistPanel checklists={checklists} userId={userId} />
                  </section>
                )}
              </div>

              {/* Divider */}
              <div className="hidden md:block shrink-0 w-px bg-border" />
              <div className="md:hidden h-px mx-6 bg-border" />

              {/* ── Right column: Comments & Activity ── */}
              <aside className="md:w-[320px] shrink-0 flex flex-col md:overflow-hidden bg-[var(--list)]/40">
                <ActivityPanel plotId={plot.id} userId={userId} sidebar />
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ChipBtn({
  icon: Icon,
  onClick,
  children,
}: {
  icon: typeof Archive
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium text-foreground/90 bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {children}
    </button>
  )
}

/** Pick black/white ink for a given hex bg so label text stays legible. */
function readableInk(hex: string): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return '#fff'
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#1D2125' : '#fff'
}

function DField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">{label}</label>
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
        <label className="text-xs text-muted-foreground">{label}</label>
        <span className="text-xs font-medium text-foreground tabular-nums">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  )
}

const inputCls = 'w-full rounded-lg px-3 py-1.5 text-sm text-foreground bg-card border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring placeholder:text-muted-foreground/50 transition-colors'
