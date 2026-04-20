'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle, Zap, Droplets, Flame, Waves, ChevronDown } from 'lucide-react'

const ZONE_LABELS: Record<string, string> = {
  Residential: 'Жилая',
  Commercial: 'Коммерческая',
  Agricultural: 'С/х',
  'Mixed-use': 'Смешанная',
}

const ZONE_COLORS: Record<string, string> = {
  Residential: '#4BCE97',
  Commercial: '#FEA362',
  Agricultural: '#F5CD47',
  'Mixed-use': '#9F8FEF',
}

const INFRA_ITEMS = [
  { key: 'infra_electricity' as const, icon: Zap,      label: 'Электричество' },
  { key: 'infra_water'       as const, icon: Droplets, label: 'Вода' },
  { key: 'infra_gas'         as const, icon: Flame,    label: 'Газ' },
  { key: 'infra_sewer'       as const, icon: Waves,    label: 'Канализация' },
]

export type ListingPlot = {
  id: string
  address: string
  size_sotok: number
  price_usd_per_100sqm: number | null
  zone: string | null
  legal_clearance: boolean | null
  notes: string | null
  infra_electricity: boolean | null
  infra_water: boolean | null
  infra_gas: boolean | null
  infra_sewer: boolean | null
}

export function ListingRow({ plot }: { plot: ListingPlot }) {
  const [infraOpen, setInfraOpen] = useState(false)

  const accentColor = plot.zone ? (ZONE_COLORS[plot.zone] ?? '#DFE1E6') : '#DFE1E6'
  const totalPrice = plot.price_usd_per_100sqm != null
    ? Math.round(plot.price_usd_per_100sqm * plot.size_sotok)
    : null

  return (
    <li className="bg-white rounded-xl border border-[#DFE1E6] shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex">
        {/* Zone accent bar */}
        <div className="w-1 shrink-0 rounded-l-xl" style={{ backgroundColor: accentColor }} />

        <div className="flex-1 min-w-0 p-4">
          {/* Main row */}
          <div className="flex items-start gap-4">
            {/* Left col: size + total price */}
            <div className="w-20 shrink-0 text-right">
              <p className="text-base font-bold text-gray-900 leading-tight">{plot.size_sotok} сот</p>
              {totalPrice != null && (
                <p className="text-xs text-gray-500 mt-0.5">${totalPrice.toLocaleString('en')}</p>
              )}
            </div>

            {/* Center: address + notes — link here */}
            <Link href={`/listings/${plot.id}`} className="flex-1 min-w-0 group">
              <h2 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors truncate">
                {plot.address}
              </h2>
              {plot.notes && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{plot.notes}</p>
              )}
            </Link>

            {/* Right: zone badge + legal + infra toggle */}
            <div className="shrink-0 flex items-center gap-2">
              {plot.zone && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-gray-800"
                  style={{ backgroundColor: accentColor + '33' }}
                >
                  {ZONE_LABELS[plot.zone] ?? plot.zone}
                </span>
              )}

              {plot.legal_clearance === true
                ? <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#4BCE97' }} />
                : <XCircle className="w-4 h-4 shrink-0" style={{ color: '#F87168' }} />
              }

              <button
                onClick={() => setInfraOpen(v => !v)}
                className="p-0.5 rounded hover:bg-gray-100 transition-colors"
                aria-label="Показать инфраструктуру"
              >
                <ChevronDown
                  className="w-4 h-4 text-gray-400 transition-transform"
                  style={{ transform: infraOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
            </div>
          </div>

          {/* Infra expanded panel */}
          {infraOpen && (
            <div className="mt-3 pt-3 border-t border-[#DFE1E6] flex flex-wrap gap-2">
              {INFRA_ITEMS.map(({ key, icon: Icon, label }) => {
                const val = plot[key]
                const color = val === true ? '#579DFF' : '#DFE1E6'
                return (
                  <span
                    key={key}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: val === true ? '#E9F2FF' : '#F1F2F4',
                      color: val === true ? '#0052CC' : '#97A0AF',
                      textDecoration: val === false ? 'line-through' : undefined,
                    }}
                  >
                    <Icon className="w-3 h-3" style={{ color }} />
                    {label}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
