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
  dark?: boolean
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

export function ProfitCalculator({ plotId, ownerSharePct, durationMonths, snapshot, userId, dark }: Props) {
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

  const d = dark ?? false

  const labelCls = d ? 'block text-xs text-white/40 mb-1' : 'block text-xs text-gray-500 mb-1'
  const inputCls = d
    ? 'w-full rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white/5 border border-white/10 focus:border-indigo-500/50'
    : 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const groupCls = d
    ? 'rounded-lg p-3 space-y-1.5 bg-white/5'
    : 'bg-gray-50 rounded-lg p-3 space-y-1.5'
  const groupTitleCls = d ? 'text-xs font-medium text-white/30 uppercase tracking-wide' : 'text-xs font-medium text-gray-400 uppercase tracking-wide'

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className={`text-sm font-semibold ${d ? 'text-white/80' : 'text-gray-900'}`}>Калькулятор доходности</h3>
        <button
          onClick={saveSnapshot}
          disabled={saving}
          className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Сохранение...' : 'Сохранить расчёт'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-3">
          <h4 className={`text-xs font-semibold uppercase tracking-wide ${d ? 'text-white/30' : 'text-gray-500'}`}>Входные данные</h4>

          <NumInput dark={d} label="Стоимость земли (USD)" value={inputs.land_acquisition_cost} onChange={v => set('land_acquisition_cost', v)} />
          <NumInput dark={d} label="Стоимость строительства (USD/м²)" value={inputs.construction_cost_per_sqm} onChange={v => set('construction_cost_per_sqm', v)} />
          <NumInput dark={d} label="Общая площадь застройки (м²)" value={inputs.total_buildable_area_sqm} onChange={v => set('total_buildable_area_sqm', v)} />

          <div>
            <label className={labelCls}>
              Доля собственника (%) <Lock className="inline w-3 h-3 ml-1 opacity-50" />
            </label>
            <div className={`w-full rounded-lg px-3 py-2 text-sm ${d ? 'bg-white/5 border border-white/10 text-white/40' : 'border border-gray-200 bg-gray-50 text-gray-500'}`}>
              {ownerSharePct}%
            </div>
          </div>

          <NumInput dark={d} label="Средняя цена продажи (USD/м²)" value={inputs.avg_sale_price_per_sqm} onChange={v => set('avg_sale_price_per_sqm', v)} />
          <NumInput dark={d} label="Ставка финансирования (% годовых)" value={inputs.financing_rate_pct} onChange={v => set('financing_rate_pct', v)} step={0.5} />
          <NumInput dark={d} label="Налоговая ставка (%)" value={inputs.tax_rate_pct} onChange={v => set('tax_rate_pct', v)} step={0.5} />
          <NumInput dark={d} label="Резерв на непредвиденное (%)" value={inputs.contingency_pct} onChange={v => set('contingency_pct', v)} step={0.5} />
          <NumInput dark={d} label="Длительность проекта (мес.)" value={inputs.project_duration_months} onChange={v => set('project_duration_months', v)} step={1} />
        </div>

        {/* Outputs */}
        <div className="space-y-2">
          <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${d ? 'text-white/30' : 'text-gray-500'}`}>Результат</h4>

          <div className={groupCls}>
            <p className={groupTitleCls}>Площадь</p>
            <OutputRow dark={d} label="Доля собственника (м²)" value={formatSqm(outputs.owner_share_deduction_sqm)} />
            <OutputRow dark={d} label="Эффективная площадь продаж" value={formatSqm(outputs.effective_sellable_area_sqm)} highlight />
          </div>

          <div className={groupCls}>
            <p className={groupTitleCls}>Затраты</p>
            <OutputRow dark={d} label="Строительство" value={formatUSD(outputs.construction_total)} />
            <OutputRow dark={d} label="Финансирование" value={formatUSD(outputs.financing_cost)} />
            <OutputRow dark={d} label="Резерв" value={formatUSD(outputs.contingency_amount)} />
            <OutputRow dark={d} label="Итого затраты" value={formatUSD(outputs.total_development_cost)} highlight />
          </div>

          <div className={groupCls}>
            <p className={groupTitleCls}>Выручка и прибыль</p>
            <OutputRow dark={d} label="Выручка" value={formatUSD(outputs.total_projected_revenue)} />
            <OutputRow dark={d} label="Валовая прибыль" value={formatUSD(outputs.gross_profit)} />
            <OutputRow dark={d} label="Чистая прибыль" value={formatUSD(outputs.net_profit)} highlight positive={outputs.net_profit > 0} />
          </div>

          <div className={groupCls}>
            <p className={groupTitleCls}>Метрики</p>
            <OutputRow dark={d} label="ROI" value={formatPct(outputs.roi_pct)} positive={outputs.roi_pct > 0} />
            <OutputRow dark={d} label="IRR (ежегодный)" value={formatPct(outputs.irr_pct)} />
            <OutputRow dark={d} label="Аннуализированный доход" value={formatPct(outputs.annualized_return_pct)} />
            <OutputRow dark={d} label="Break-even (USD/м²)" value={formatUSD(outputs.breakeven_price_per_sqm)} />
          </div>
        </div>
      </div>
    </div>
  )
}

function NumInput({ label, value, onChange, step = 1, dark }: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  dark?: boolean
}) {
  return (
    <div>
      <label className={`block text-xs mb-1 ${dark ? 'text-white/40' : 'text-gray-500'}`}>{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className={dark
          ? 'w-full rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white/5 border border-white/10 focus:border-indigo-500/50'
          : 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
        }
      />
    </div>
  )
}

function OutputRow({ label, value, highlight, positive, dark }: {
  label: string
  value: string
  highlight?: boolean
  positive?: boolean
  dark?: boolean
}) {
  const valColor = positive === true
    ? 'text-green-400'
    : positive === false
    ? 'text-red-400'
    : highlight
    ? (dark ? 'text-white' : 'text-gray-900')
    : (dark ? 'text-white/60' : 'text-gray-700')

  return (
    <div className="flex justify-between items-center text-sm gap-2">
      <span className={`text-xs ${dark ? 'text-white/40' : 'text-gray-600'}`}>{label}</span>
      <span className={`font-semibold text-right ${valColor}`}>{value}</span>
    </div>
  )
}
