'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  XCircle,
  Zap,
  Droplets,
  Flame,
  Waves,
  MapPin,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
  { key: 'infra_electricity' as const, icon: Zap,      label: 'Свет' },
  { key: 'infra_water'       as const, icon: Droplets, label: 'Вода' },
  { key: 'infra_gas'         as const, icon: Flame,    label: 'Газ' },
  { key: 'infra_sewer'       as const, icon: Waves,    label: 'Канал.' },
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

function sotokForm(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'сотка'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'сотки'
  return 'соток'
}

export function ListingRow({ plot }: { plot: ListingPlot }) {
  const [open, setOpen] = useState(false)
  const accentColor = plot.zone ? (ZONE_COLORS[plot.zone] ?? '#94a3b8') : '#94a3b8'
  const totalPrice = plot.price_usd_per_100sqm != null
    ? Math.round(plot.price_usd_per_100sqm * plot.size_sotok)
    : null
  const infraCount = INFRA_ITEMS.filter(({ key }) => plot[key] === true).length

  return (
    <li
      className={cn(
        'rounded-lg bg-card ring-1 ring-foreground/10 overflow-hidden transition-all',
        open ? 'ring-primary/30 shadow-sm' : 'hover:ring-primary/30',
      )}
    >
      {/* Collapsed essential row */}
      <div className="flex items-center gap-2 sm:gap-3 pl-2 pr-1.5 py-1.5">
        {/* Size chip */}
        <div
          className="shrink-0 w-12 h-12 rounded-md flex flex-col items-center justify-center"
          style={{ background: `linear-gradient(180deg, ${accentColor}26 0%, ${accentColor}0A 100%)` }}
        >
          <p className="text-base font-semibold text-foreground leading-none tabular-nums">
            {plot.size_sotok}
          </p>
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-foreground/80">
            {sotokForm(plot.size_sotok)}
          </p>
        </div>

        {/* Zone chip */}
        {plot.zone && (
          <Badge
            variant="outline"
            className="shrink-0 border-transparent text-foreground/80 text-[11px] font-medium"
            style={{ boxShadow: `inset 0 0 0 1px ${accentColor}66`, backgroundColor: accentColor + '14' }}
          >
            <span className="size-1.5 rounded-full mr-0.5" style={{ backgroundColor: accentColor }} />
            {ZONE_LABELS[plot.zone] ?? plot.zone}
          </Badge>
        )}

        {/* Address */}
        <Link
          href={`/listings/${plot.id}`}
          className="flex-1 min-w-0 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <MapPin className="size-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{plot.address}</span>
        </Link>

        {/* Infra count — hidden on xs */}
        <span
          className="hidden sm:inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground tabular-nums"
          title={`${infraCount} из 4 инфраструктур`}
        >
          <span className={infraCount === 4 ? 'text-accent' : 'text-muted-foreground/50'}>●</span>
          {infraCount}/4
        </span>

        {/* Price */}
        <div className="shrink-0 text-right min-w-[72px] sm:min-w-[92px]">
          {plot.price_usd_per_100sqm != null ? (
            <>
              <p className="text-sm font-semibold text-foreground tabular-nums leading-tight">
                ${plot.price_usd_per_100sqm.toLocaleString('en')}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">/ 100 м²</p>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground">По запросу</p>
          )}
        </div>

        {/* Chevron toggle */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-label={open ? 'Свернуть' : 'Развернуть'}
          className={cn(
            'shrink-0 inline-flex items-center justify-center size-8 rounded-md text-muted-foreground transition',
            'hover:bg-muted hover:text-foreground',
            open && 'bg-muted text-foreground',
          )}
        >
          <ChevronDown
            className={cn('size-4 transition-transform duration-200', open && 'rotate-180')}
          />
        </button>
      </div>

      {/* Expanded details */}
      {open && (
        <div className="border-t border-border px-3 py-3 space-y-2.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Legal */}
            {plot.legal_clearance === true ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                <CheckCircle2 className="size-3.5" />
                Красная книга
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <XCircle className="size-3.5" />
                Без кр. книги
              </span>
            )}

            {/* Infra breakdown */}
            <div className="inline-flex items-center gap-2">
              {INFRA_ITEMS.map(({ key, icon: Icon, label }) => {
                const val = plot[key] === true
                return (
                  <span
                    key={key}
                    title={label}
                    className={cn(
                      'inline-flex items-center gap-1 text-[11px]',
                      val ? 'text-accent' : 'text-muted-foreground/50',
                    )}
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </span>
                )
              })}
            </div>

            {/* Total price */}
            {totalPrice != null && (
              <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                ~${totalPrice.toLocaleString('en')} итого
              </span>
            )}
          </div>

          {plot.notes && (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {plot.notes}
            </p>
          )}

          <Link
            href={`/listings/${plot.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Подробнее
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      )}
    </li>
  )
}
