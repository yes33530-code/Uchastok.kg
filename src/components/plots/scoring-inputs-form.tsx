'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { saveScoringInputs, updatePlot } from '@/actions/plots'
import type { ScoringInputs, Plot } from '@/types/plot'

const INFRA_UTILITIES = [
  { key: 'infra_electricity', label: 'Свет',        icon: '⚡' },
  { key: 'infra_water',       label: 'Вода',         icon: '💧' },
  { key: 'infra_gas',         label: 'Газ',          icon: '🔥' },
  { key: 'infra_sewer',       label: 'Канализация',  icon: '🪣' },
] as const

type InfraField = typeof INFRA_UTILITIES[number]['key']

interface Props {
  plotId: string
  initialValues: Omit<ScoringInputs, 'id' | 'plot_id' | 'updated_at'> | null
  initialInfra: Pick<Plot, 'infra_electricity' | 'infra_water' | 'infra_gas' | 'infra_sewer'>
}

export function ScoringInputsForm({ plotId, initialValues, initialInfra }: Props) {
  const [values, setValues] = useState({
    location_quality: initialValues?.location_quality ?? 50,
    price_vs_market_pct: initialValues?.price_vs_market_pct ?? 0,
    buildout_potential: initialValues?.buildout_potential ?? 50,
  })
  const [infra, setInfra] = useState<Record<InfraField, boolean>>({
    infra_electricity: initialInfra.infra_electricity ?? false,
    infra_water:       initialInfra.infra_water       ?? false,
    infra_gas:         initialInfra.infra_gas         ?? false,
    infra_sewer:       initialInfra.infra_sewer       ?? false,
  })
  const [saving, setSaving] = useState(false)

  async function toggleInfra(key: InfraField) {
    const next = { ...infra, [key]: !infra[key] }
    setInfra(next)
    try {
      await updatePlot(plotId, next)
    } catch {
      toast.error('Ошибка сохранения инфраструктуры')
    }
  }

  async function save() {
    setSaving(true)
    try {
      await saveScoringInputs(plotId, values)
      toast.success('Параметры оценки сохранены')
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-md p-4 bg-[var(--list)]/60 border border-border">
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Параметры оценки</h3>
      <div className="space-y-4">
        {/* Infrastructure toggles */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs text-muted-foreground">Инфраструктура</label>
            <span className="text-xs font-medium text-foreground/80">
              {Object.values(infra).filter(Boolean).length}/4
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {INFRA_UTILITIES.map(u => {
              const on = infra[u.key]
              return (
                <button
                  key={u.key}
                  type="button"
                  onClick={() => toggleInfra(u.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    on
                      ? 'bg-primary/25 border-primary/60 text-primary'
                      : 'bg-muted/60 border-border text-muted-foreground/60'
                  }`}
                >
                  <span>{u.icon}</span>
                  {u.label}
                </button>
              )
            })}
          </div>
        </div>

        <SliderField
          label="Качество локации"
          value={values.location_quality}
          onChange={v => setValues(s => ({ ...s, location_quality: v }))}
          min={0} max={100}
        />
        <SliderField
          label="Потенциал застройки"
          value={values.buildout_potential}
          onChange={v => setValues(s => ({ ...s, buildout_potential: v }))}
          min={0} max={100}
        />
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Цена vs рынок (% — отрицательное = ниже рынка)
          </label>
          <input
            type="number"
            step="0.5"
            value={values.price_vs_market_pct}
            onChange={e => setValues(s => ({ ...s, price_vs_market_pct: parseFloat(e.target.value) || 0 }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40 bg-muted/60 focus:border-ring border border-border"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {saving ? 'Сохранение...' : 'Сохранить оценку'}
        </button>
      </div>
    </div>
  )
}

function SliderField({ label, value, onChange, min, max }: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        <span className="text-xs font-medium text-foreground/80">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  )
}
