'use client'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { calculate } from '@/lib/calculator/formulas'
import { saveCalculatorSnapshot } from '@/actions/plots'
import type { CalculatorSnapshot } from '@/types/plot'
import type { CalcInputs } from '@/types/calculator'
import { DEFAULT_CALC_INPUTS } from '@/types/calculator'
import { formatUSD, formatSqm, formatPct, formatNumber } from '@/lib/utils'
import { Lock } from 'lucide-react'

interface Props {
  plotId: string
  ownerSharePct: number
  durationMonths: number | null
  snapshot: Omit<CalculatorSnapshot, 'id' | 'plot_id' | 'updated_at'> | null
  userId: string
}

function snapshotToInputs(
  snapshot: Omit<CalculatorSnapshot, 'id' | 'plot_id' | 'updated_at'> | null,
  ownerSharePct: number,
  durationMonths: number | null
): CalcInputs {
  if (!snapshot) return { ...DEFAULT_CALC_INPUTS, owner_share_pct: ownerSharePct, project_duration_months: durationMonths ?? 12 }
  return {
    land_acquisition_cost: snapshot.land_acquisition_cost ?? 0,
    construction_cost_per_sqm: snapshot.construction_cost_per_sqm ?? 0,
    total_buildable_area_sqm: snapshot.total_buildable_area_sqm ?? 0,
    owner_share_pct: ownerSharePct,
    avg_sale_price_per_sqm: snapshot.avg_sale_price_per_sqm ?? 0,
    financing_rate_pct: snapshot.financing_rate_pct ?? 0,
    tax_rate_pct: snapshot.tax_rate_pct ?? 0,
    contingency_pct: snapshot.contingency_pct ?? 0,
    project_duration_months: durationMonths ?? snapshot.project_duration_months ?? 12,
  }
}

export function ProfitCalculator({ plotId, ownerSharePct, durationMonths, snapshot, userId }: Props) {
  const [inputs, setInputs] = useState<CalcInputs>(() =>
    snapshotToInputs(snapshot, ownerSharePct, durationMonths)
  )
  const [saving, setSaving] = useState(false)

  const outputs = useMemo(() => calculate(inputs), [inputs])

  function set(key: keyof CalcInputs, value: number) {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  async function saveSnapshot() {
    setSaving(true)
    try {
      const snapshotInputs: Record<string, number | null> = {
        land_acquisition_cost: inputs.land_acquisition_cost,
        construction_cost_per_sqm: inputs.construction_cost_per_sqm,
        total_buildable_area_sqm: inputs.total_buildable_area_sqm,
        owner_share_pct: inputs.owner_share_pct,
        avg_sale_price_per_sqm: inputs.avg_sale_price_per_sqm,
        financing_rate_pct: inputs.financing_rate_pct,
        tax_rate_pct: inputs.tax_rate_pct,
        contingency_pct: inputs.contingency_pct,
        project_duration_months: inputs.project_duration_months,
      }
      const snapshotOutputs: Record<string, number | null> = {
        owner_share_deduction_sqm: outputs.owner_share_deduction_sqm,
        effective_sellable_area_sqm: outputs.effective_sellable_area_sqm,
        construction_total: outputs.construction_total,
        financing_cost: outputs.financing_cost,
        contingency_amount: outputs.contingency_amount,
        total_development_cost: outputs.total_development_cost,
        total_projected_revenue: outputs.total_projected_revenue,
        gross_profit: outputs.gross_profit,
        net_profit: outputs.net_profit,
        roi_pct: outputs.roi_pct,
        irr_pct: outputs.irr_pct,
        breakeven_price_per_sqm: outputs.breakeven_price_per_sqm,
        annualized_return_pct: outputs.annualized_return_pct,
      }
      await saveCalculatorSnapshot(plotId, snapshotInputs, snapshotOutputs)
      toast.success('Расчёт сохранён, оценка обновлена')
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const labelCls = 'block text-xs text-muted-foreground mb-1'
  const inputCls = 'w-full border border-border bg-card text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring placeholder:text-muted-foreground/50 transition-colors'
  const groupCls = 'bg-muted/50 rounded-lg p-3 space-y-1.5'
  const groupTitleCls = 'text-xs font-medium text-muted-foreground uppercase tracking-wide'

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground">Калькулятор доходности</h3>
        <button
          onClick={saveSnapshot}
          disabled={saving}
          className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Сохранение...' : 'Сохранить расчёт'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Входные данные</h4>

          <NumInput label="Стоимость земли (USD)" value={inputs.land_acquisition_cost} onChange={v => set('land_acquisition_cost', v)} />
          <NumInput label="Стоимость строительства (USD/м²)" value={inputs.construction_cost_per_sqm} onChange={v => set('construction_cost_per_sqm', v)} />
          <NumInput label="Общая площадь застройки (м²)" value={inputs.total_buildable_area_sqm} onChange={v => set('total_buildable_area_sqm', v)} />

          <div>
            <label className={labelCls}>
              Доля собственника (%) <Lock className="inline w-3 h-3 ml-1 opacity-50" />
            </label>
            <div className="w-full rounded-lg px-3 py-2 text-sm border border-border bg-muted/40 text-muted-foreground">
              {ownerSharePct}%
            </div>
          </div>

          <NumInput label="Средняя цена продажи (USD/м²)" value={inputs.avg_sale_price_per_sqm} onChange={v => set('avg_sale_price_per_sqm', v)} />
          <NumInput label="Ставка финансирования (% годовых)" value={inputs.financing_rate_pct} onChange={v => set('financing_rate_pct', v)} step={0.5} />
          <NumInput label="Налоговая ставка (%)" value={inputs.tax_rate_pct} onChange={v => set('tax_rate_pct', v)} step={0.5} />
          <NumInput label="Резерв на непредвиденное (%)" value={inputs.contingency_pct} onChange={v => set('contingency_pct', v)} step={0.5} />
          <NumInput label="Длительность проекта (мес.)" value={inputs.project_duration_months} onChange={v => set('project_duration_months', v)} step={1} />
        </div>

        {/* Outputs */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide mb-3 text-muted-foreground">Результат</h4>

          <div className={groupCls}>
            <p className={groupTitleCls}>Площадь</p>
            <OutputRow label="Доля собственника (м²)" value={formatSqm(outputs.owner_share_deduction_sqm)} />
            <OutputRow label="Эффективная площадь продаж" value={formatSqm(outputs.effective_sellable_area_sqm)} highlight />
          </div>

          <div className={groupCls}>
            <p className={groupTitleCls}>Затраты</p>
            <OutputRow label="Строительство" value={formatUSD(outputs.construction_total)} />
            <OutputRow label="Финансирование" value={formatUSD(outputs.financing_cost)} />
            <OutputRow label="Резерв" value={formatUSD(outputs.contingency_amount)} />
            <OutputRow label="Итого затраты" value={formatUSD(outputs.total_development_cost)} highlight />
          </div>

          <div className={groupCls}>
            <p className={groupTitleCls}>Выручка и прибыль</p>
            <OutputRow label="Выручка" value={formatUSD(outputs.total_projected_revenue)} />
            <OutputRow label="Валовая прибыль" value={formatUSD(outputs.gross_profit)} />
            <OutputRow label="Чистая прибыль" value={formatUSD(outputs.net_profit)} highlight positive={outputs.net_profit > 0} />
          </div>

          <div className={groupCls}>
            <p className={groupTitleCls}>Метрики</p>
            <OutputRow label="ROI" value={formatPct(outputs.roi_pct)} positive={outputs.roi_pct > 0} />
            <OutputRow label="IRR (ежегодный)" value={formatPct(outputs.irr_pct)} />
            <OutputRow label="Аннуализированный доход" value={formatPct(outputs.annualized_return_pct)} />
            <OutputRow label="Break-even (USD/м²)" value={formatUSD(outputs.breakeven_price_per_sqm)} />
          </div>
        </div>
      </div>
    </div>
  )
}

function NumInput({ label, value, onChange, step = 1 }: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  return (
    <div>
      <label className="block text-xs mb-1 text-muted-foreground">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full border border-border bg-card text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-colors"
      />
    </div>
  )
}

function OutputRow({ label, value, highlight, positive }: {
  label: string
  value: string
  highlight?: boolean
  positive?: boolean
}) {
  const valColor = positive === true
    ? 'text-primary'
    : positive === false
    ? 'text-destructive'
    : highlight
    ? 'text-foreground'
    : 'text-foreground/80'

  return (
    <div className="flex justify-between items-center text-sm gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-semibold text-right tabular-nums ${valColor}`}>{value}</span>
    </div>
  )
}
