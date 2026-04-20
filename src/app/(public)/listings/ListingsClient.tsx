'use client'

import { useState, useMemo } from 'react'
import { Zap, Droplets, Flame, Waves } from 'lucide-react'
import { ListingRow, type ListingPlot } from './ListingRow'

const ZONES = [
  { value: 'all',        label: 'Все' },
  { value: 'Residential', label: 'Жилая',       color: '#4BCE97' },
  { value: 'Commercial',  label: 'Коммерческая', color: '#FEA362' },
  { value: 'Agricultural',label: 'С/х',          color: '#F5CD47' },
  { value: 'Mixed-use',   label: 'Смешанная',    color: '#9F8FEF' },
]

const INFRA_FILTERS = [
  { key: 'infra_electricity' as const, icon: Zap,      label: 'Электричество' },
  { key: 'infra_water'       as const, icon: Droplets, label: 'Вода' },
  { key: 'infra_gas'         as const, icon: Flame,    label: 'Газ' },
  { key: 'infra_sewer'       as const, icon: Waves,    label: 'Канализация' },
]

export function ListingsClient({ plots }: { plots: ListingPlot[] }) {
  const [zone, setZone] = useState('all')
  const [legalOnly, setLegalOnly] = useState(false)
  const [infraReq, setInfraReq] = useState<Set<string>>(new Set())

  // Stats from full list
  const prices = plots.map(p => p.price_usd_per_100sqm).filter((p): p is number => p != null)
  const minPrice = prices.length ? Math.min(...prices) : null
  const maxPrice = prices.length ? Math.max(...prices) : null
  const avgSize = plots.length ? Math.round(plots.reduce((s, p) => s + p.size_sotok, 0) / plots.length) : 0

  const filtered = useMemo(() => plots
    .filter(p => zone === 'all' || p.zone === zone)
    .filter(p => !legalOnly || p.legal_clearance === true)
    .filter(p => infraReq.size === 0 || [...infraReq].every(k => p[k as keyof ListingPlot] === true)),
    [plots, zone, legalOnly, infraReq]
  )

  function toggleInfra(key: string) {
    setInfraReq(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <>
      {/* Stats strip */}
      {plots.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-sm px-6 py-4 mb-4 flex flex-wrap gap-6">
          <Stat label="Участков" value={String(plots.length)} />
          {avgSize > 0 && <Stat label="Средний размер" value={`${avgSize} сот`} />}
          {minPrice != null && maxPrice != null && (
            <Stat
              label="Цена / 100 м²"
              value={minPrice === maxPrice
                ? `$${minPrice.toLocaleString('en')}`
                : `$${minPrice.toLocaleString('en')} — $${maxPrice.toLocaleString('en')}`}
            />
          )}
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-sm px-5 py-4 mb-6 space-y-3">
        {/* Zone pills */}
        <div className="flex flex-wrap gap-2">
          {ZONES.map(z => {
            const active = zone === z.value
            return (
              <button
                key={z.value}
                onClick={() => setZone(z.value)}
                className="text-xs font-semibold px-3 py-1 rounded-full border transition-all"
                style={active && z.color ? {
                  backgroundColor: z.color + '33',
                  borderColor: z.color,
                  color: '#172B4D',
                } : active ? {
                  backgroundColor: '#E4F0F6',
                  borderColor: '#0079BF',
                  color: '#0052CC',
                } : {
                  backgroundColor: '#F1F2F4',
                  borderColor: '#DFE1E6',
                  color: '#97A0AF',
                }}
              >
                {z.label}
              </button>
            )
          })}
        </div>

        {/* Legal + infra toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setLegalOnly(v => !v)}
            className="text-xs font-semibold px-3 py-1 rounded-full border transition-all"
            style={legalOnly ? {
              backgroundColor: '#E3FCEF',
              borderColor: '#4BCE97',
              color: '#006644',
            } : {
              backgroundColor: '#F1F2F4',
              borderColor: '#DFE1E6',
              color: '#97A0AF',
            }}
          >
            ✅ Красная книга
          </button>

          {INFRA_FILTERS.map(({ key, icon: Icon, label }) => {
            const active = infraReq.has(key)
            return (
              <button
                key={key}
                onClick={() => toggleInfra(key)}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border transition-all"
                style={active ? {
                  backgroundColor: '#E9F2FF',
                  borderColor: '#579DFF',
                  color: '#0052CC',
                } : {
                  backgroundColor: '#F1F2F4',
                  borderColor: '#DFE1E6',
                  color: '#97A0AF',
                }}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-sm text-center py-16 text-gray-400">
          <p className="font-medium">Нет участков по выбранным фильтрам</p>
          <button
            onClick={() => { setZone('all'); setLegalOnly(false); setInfraReq(new Set()) }}
            className="mt-3 text-sm text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map(plot => <ListingRow key={plot.id} plot={plot} />)}
        </ul>
      )}
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}
