'use client'

import { useState, useMemo } from 'react'
import { Zap, Droplets, Flame, Waves, Check, X, SlidersHorizontal } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ListingRow, type ListingPlot } from './ListingRow'

const ZONES = [
  { value: 'all',         label: 'Все',          color: null       },
  { value: 'Residential', label: 'Жилая',        color: '#4BCE97' },
  { value: 'Commercial',  label: 'Коммерческая', color: '#FEA362' },
  { value: 'Agricultural',label: 'С/х',          color: '#F5CD47' },
  { value: 'Mixed-use',   label: 'Смешанная',    color: '#9F8FEF' },
] as const

const INFRA_FILTERS = [
  { key: 'infra_electricity' as const, icon: Zap,      label: 'Электричество' },
  { key: 'infra_water'       as const, icon: Droplets, label: 'Вода' },
  { key: 'infra_gas'         as const, icon: Flame,    label: 'Газ' },
  { key: 'infra_sewer'       as const, icon: Waves,    label: 'Канализация' },
]

export function ListingsClient({ plots }: { plots: ListingPlot[] }) {
  const [zone, setZone] = useState<string>('all')
  const [legalOnly, setLegalOnly] = useState(false)
  const [infraReq, setInfraReq] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => plots
    .filter(p => zone === 'all' || p.zone === zone)
    .filter(p => !legalOnly || p.legal_clearance === true)
    .filter(p => infraReq.size === 0 || [...infraReq].every(k => p[k as keyof ListingPlot] === true)),
    [plots, zone, legalOnly, infraReq]
  )

  const activeFilters = (zone !== 'all' ? 1 : 0) + (legalOnly ? 1 : 0) + infraReq.size

  function toggleInfra(key: string) {
    setInfraReq(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function resetFilters() {
    setZone('all')
    setLegalOnly(false)
    setInfraReq(new Set())
  }

  const filterPanel = (
    <div className="rounded-2xl border border-border bg-card ring-1 ring-foreground/5 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          Фильтры
        </div>
        {activeFilters > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3" />
            Сбросить ({activeFilters})
          </button>
        )}
      </div>

      <Separator />

      {/* Zone */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
          Зонирование
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ZONES.map(z => {
            const active = zone === z.value
            return (
              <Toggle
                key={z.value}
                size="sm"
                pressed={active}
                onPressedChange={() => setZone(z.value)}
                style={active && z.color ? {
                  backgroundColor: z.color + '26',
                  boxShadow: `inset 0 0 0 1px ${z.color}`,
                  color: 'var(--foreground)',
                } : undefined}
              >
                {z.label}
              </Toggle>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Legal */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
          Документы
        </p>
        <Toggle
          size="sm"
          pressed={legalOnly}
          onPressedChange={setLegalOnly}
          className={legalOnly
            ? 'bg-primary/10 text-primary data-[state=on]:bg-primary/10 ring-1 ring-primary/30'
            : ''}
        >
          <Check className="size-3.5" />
          Красная книга
        </Toggle>
      </div>

      <Separator />

      {/* Infra */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
          Инфраструктура
        </p>
        <div className="flex flex-wrap gap-1.5">
          {INFRA_FILTERS.map(({ key, icon: Icon, label }) => {
            const active = infraReq.has(key)
            return (
              <Toggle
                key={key}
                size="sm"
                pressed={active}
                onPressedChange={() => toggleInfra(key)}
                className={active
                  ? 'bg-accent/10 text-accent data-[state=on]:bg-accent/10 ring-1 ring-accent/30'
                  : ''}
              >
                <Icon className="size-3.5" />
                {label}
              </Toggle>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 lg:gap-8 items-start">
      {/* Results column */}
      <div className="min-w-0 lg:order-1 order-2">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length === plots.length
              ? `Показаны все ${plots.length}`
              : `Найдено: ${filtered.length} из ${plots.length}`}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card ring-1 ring-foreground/5 text-center py-16 px-6">
            <p className="font-medium text-foreground">Нет записей по выбранным фильтрам</p>
            <Button variant="link" onClick={resetFilters} className="mt-2">
              Сбросить фильтры
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map(plot => <ListingRow key={plot.id} plot={plot} />)}
          </ul>
        )}
      </div>

      {/* Filter sidebar — right on desktop, top on mobile */}
      <aside className="lg:order-2 order-1 lg:sticky lg:top-24">
        {filterPanel}
      </aside>
    </div>
  )
}
