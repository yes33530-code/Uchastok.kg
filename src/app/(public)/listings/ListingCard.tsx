'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, CheckCircle, XCircle, Zap, Droplets, Flame, Waves, ChevronDown } from 'lucide-react'

const ZONE_LABELS: Record<string, string> = {
  Residential: 'Жилая',
  Commercial: 'Коммерческая',
  Agricultural: 'С/х',
  'Mixed-use': 'Смешанная',
}

const ZONE_COLORS: Record<string, string> = {
  Residential: 'bg-blue-100 text-blue-700',
  Commercial: 'bg-orange-100 text-orange-700',
  Agricultural: 'bg-green-100 text-green-700',
  'Mixed-use': 'bg-purple-100 text-purple-700',
}

type Plot = {
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

const INFRA_ITEMS = [
  { key: 'infra_electricity' as const, icon: Zap,      label: 'Электричество' },
  { key: 'infra_water'       as const, icon: Droplets, label: 'Вода' },
  { key: 'infra_gas'         as const, icon: Flame,    label: 'Газ' },
  { key: 'infra_sewer'       as const, icon: Waves,    label: 'Канализация' },
]

export function ListingCard({ plot }: { plot: Plot }) {
  const [infraOpen, setInfraOpen] = useState(false)

  return (
    <div className="group bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-150 overflow-hidden flex flex-col">
      <div className="h-1 bg-indigo-500 group-hover:bg-indigo-600 transition-colors" />

      <div className="p-3 flex flex-col flex-1 gap-2">
        {plot.zone && (
          <span className={`self-start text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ZONE_COLORS[plot.zone] ?? 'bg-gray-100 text-gray-600'}`}>
            {ZONE_LABELS[plot.zone] ?? plot.zone}
          </span>
        )}

        <Link href={`/listings/${plot.id}`} className="block">
          <h2 className="font-semibold text-gray-900 text-xs leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
            {plot.address}
          </h2>
        </Link>

        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-gray-400">Площадь</span>
            <span className="font-medium text-gray-700 text-right">{plot.size_sotok} сот.</span>
          </div>
          {plot.price_usd_per_100sqm && (
            <div className="flex justify-between">
              <span className="text-gray-400">Цена</span>
              <span className="font-medium text-gray-700">${plot.price_usd_per_100sqm.toLocaleString('en')}</span>
            </div>
          )}
        </div>

        {plot.notes && (
          <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{plot.notes}</p>
        )}

        <div className="mt-auto pt-2 border-t border-gray-100 space-y-1.5">
          <div className="flex items-center gap-1 text-[10px]">
            {plot.legal_clearance
              ? <><CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" /><span className="text-emerald-600 font-medium">Красная книга</span></>
              : <><XCircle className="w-3 h-3 text-red-400 shrink-0" /><span className="text-red-500 font-medium">Нет книги</span></>
            }
          </div>

          <button
            onClick={() => setInfraOpen(v => !v)}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors w-full"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${infraOpen ? 'rotate-180' : ''}`} />
            Инфраструктура
          </button>

          {infraOpen && (
            <div className="flex flex-col gap-1">
              {INFRA_ITEMS.map(({ key, icon: Icon, label }) => {
                const val = plot[key]
                return (
                  <span
                    key={key}
                    className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      val === true  ? 'bg-emerald-50 text-emerald-700' :
                      val === false ? 'bg-red-50 text-red-400 line-through' :
                                      'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Icon className="w-2.5 h-2.5 shrink-0" />
                    {label}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
