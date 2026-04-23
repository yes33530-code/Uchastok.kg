import Link from 'next/link'
import { CheckCircle2, XCircle, Zap, Droplets, Flame, Waves, MapPin, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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

export function ListingRow({ plot }: { plot: ListingPlot }) {
  const accentColor = plot.zone ? (ZONE_COLORS[plot.zone] ?? '#94a3b8') : '#94a3b8'
  const totalPrice = plot.price_usd_per_100sqm != null
    ? Math.round(plot.price_usd_per_100sqm * plot.size_sotok)
    : null

  const infraCount = INFRA_ITEMS.filter(({ key }) => plot[key] === true).length

  return (
    <li>
      <Link
        href={`/listings/${plot.id}`}
        className="group/card block h-full rounded-2xl bg-card ring-1 ring-foreground/10 overflow-hidden transition-all duration-200 hover:ring-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Zone banner */}
        <div
          className="relative h-24 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}14 60%, transparent 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, ${accentColor}55 1px, transparent 0)`,
              backgroundSize: '16px 16px',
            }}
          />

          <div className="relative h-full px-5 py-4 flex items-start justify-between">
            {plot.zone && (
              <Badge
                variant="outline"
                className="bg-card/80 backdrop-blur-sm border-transparent text-foreground/80 font-medium"
                style={{ boxShadow: `inset 0 0 0 1px ${accentColor}66` }}
              >
                <span
                  className="size-1.5 rounded-full mr-0.5"
                  style={{ backgroundColor: accentColor }}
                />
                {ZONE_LABELS[plot.zone] ?? plot.zone}
              </Badge>
            )}

            <div className="text-right">
              <p className="text-2xl font-semibold text-foreground leading-none tabular-nums">
                {plot.size_sotok}
                <span className="text-sm text-muted-foreground ml-1 font-normal">сот</span>
              </p>
              {totalPrice != null && (
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                  ~${totalPrice.toLocaleString('en')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pt-3 pb-5">
          {/* Address */}
          <div className="flex items-start gap-1.5">
            <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <h2 className="flex-1 font-semibold text-foreground leading-snug group-hover/card:text-primary transition-colors">
              {plot.address}
            </h2>
            <ArrowUpRight className="size-4 text-muted-foreground shrink-0 translate-y-0 opacity-0 group-hover/card:opacity-100 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 transition-all" />
          </div>

          {plot.notes && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {plot.notes}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-4 flex items-center gap-3 text-sm">
            {plot.price_usd_per_100sqm != null && (
              <span className="font-medium text-foreground tabular-nums">
                ${plot.price_usd_per_100sqm.toLocaleString('en')}
                <span className="text-muted-foreground text-xs font-normal ml-1">/ 100 м²</span>
              </span>
            )}
          </div>

          {/* Bottom row: legal + infra */}
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-3">
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

            <div className="flex items-center gap-1 text-muted-foreground">
              {INFRA_ITEMS.map(({ key, icon: Icon, label }) => {
                const val = plot[key]
                return (
                  <span
                    key={key}
                    title={label}
                    className={
                      val === true
                        ? 'text-accent'
                        : 'text-border'
                    }
                  >
                    <Icon className="size-4" />
                  </span>
                )
              })}
              {infraCount > 0 && (
                <span className="ml-1 text-xs font-medium text-foreground tabular-nums">
                  {infraCount}/4
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </li>
  )
}
