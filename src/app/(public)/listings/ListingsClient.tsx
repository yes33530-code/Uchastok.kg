'use client'

import { useState, useMemo } from 'react'
import { Zap, Droplets, Flame, Waves, Check, X } from 'lucide-react'
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

  return (
    <>
      {/* Filter bar */}
      <div className="mb-8 rounded-2xl border border-border bg-card ring-1 ring-foreground/5 p-4 sm:p-5 space-y-4">
        {/* Zone row */}
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

        {/* Legal + infra row */}
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
          <div className="flex-shrink-0">
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

          <div className="flex-1 min-w-[220px]">
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

          {activeFilters > 0 && (
            <div className="self-end">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="size-3.5" />
                Сбросить ({activeFilters})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Results header */}
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length === plots.length
            ? `Показаны все ${plots.length}`
            : `Найдено: ${filtered.length} из ${plots.length}`}
        </p>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card ring-1 ring-foreground/5 text-center py-16 px-6">
          <p className="font-medium text-foreground">Нет участков по выбранным фильтрам</p>
          <Button variant="link" onClick={resetFilters} className="mt-2">
            Сбросить фильтры
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(plot => <ListingRow key={plot.id} plot={plot} />)}
        </ul>
      )}
    </>
  )
}
