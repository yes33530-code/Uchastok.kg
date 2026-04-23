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

function sotokForm(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'сотка'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'сотки'
  return 'соток'
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
        className="group/row relative flex items-stretch rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden transition-all duration-200 hover:ring-primary/40 hover:shadow-md hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Zone accent strip (left) */}
        <div
          className="relative w-28 sm:w-36 shrink-0 flex flex-col items-center justify-center px-3 py-4"
          style={{
            background: `linear-gradient(180deg, ${accentColor}26 0%, ${accentColor}0A 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, ${accentColor}55 1px, transparent 0)`,
              backgroundSize: '14px 14px',
            }}
          />
          <div className="relative text-center">
            <p className="text-2xl sm:text-3xl font-semibold text-foreground leading-none tabular-nums">
              {plot.size_sotok}
            </p>
            <p
              className="mt-1 text-[10px] font-bold uppercase tracking-wide bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(180deg, #1e293b 0%, #64748b 45%, #cbd5e1 55%, #334155 100%)',
              }}
            >
              {sotokForm(plot.size_sotok)}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-border shrink-0" />

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-stretch">
          {/* Address + notes + zone badge */}
          <div className="flex-1 min-w-0 px-4 sm:px-5 py-4">
            <div className="flex items-start gap-2">
              {plot.zone && (
                <Badge
                  variant="outline"
                  className="border-transparent text-foreground/80 font-medium shrink-0"
                  style={{ boxShadow: `inset 0 0 0 1px ${accentColor}66`, backgroundColor: accentColor + '14' }}
                >
                  <span
                    className="size-1.5 rounded-full mr-0.5"
                    style={{ backgroundColor: accentColor }}
                  />
                  {ZONE_LABELS[plot.zone] ?? plot.zone}
                </Badge>
              )}
            </div>
            <h2 className="mt-2 flex items-start gap-1.5 font-semibold text-foreground leading-snug group-hover/row:text-primary transition-colors">
              <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="flex-1 min-w-0">{plot.address}</span>
            </h2>
            {plot.notes && (
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {plot.notes}
              </p>
            )}
          </div>

          {/* Price + meta (middle-right on desktop) */}
          <div className="px-4 sm:px-5 py-4 sm:py-5 sm:w-48 sm:shrink-0 sm:border-l sm:border-border flex sm:flex-col sm:items-end gap-3 sm:gap-1 items-baseline border-t sm:border-t-0 border-border">
            {plot.price_usd_per_100sqm != null ? (
              <>
                <p className="text-xs text-muted-foreground sm:order-1">
                  Цена / 100 м²
                </p>
                <p className="text-lg font-semibold text-foreground tabular-nums sm:order-2">
                  ${plot.price_usd_per_100sqm.toLocaleString('en')}
                </p>
                {totalPrice != null && (
                  <p className="text-xs text-muted-foreground tabular-nums sm:order-3 ml-auto sm:ml-0">
                    ~${totalPrice.toLocaleString('en')} итого
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Цена по запросу</p>
            )}
          </div>

          {/* Legal + infra (far right) */}
          <div className="px-4 sm:px-5 py-4 sm:w-52 sm:shrink-0 sm:border-l sm:border-border flex sm:flex-col gap-2 sm:gap-2.5 sm:justify-center items-start border-t sm:border-t-0 border-border">
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

            <div className="inline-flex items-center gap-1.5">
              {INFRA_ITEMS.map(({ key, icon: Icon, label }) => {
                const val = plot[key]
                return (
                  <span
                    key={key}
                    title={label}
                    className={val === true ? 'text-accent' : 'text-border'}
                  >
                    <Icon className="size-4" />
                  </span>
                )
              })}
              <span className="ml-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                {infraCount}/4
              </span>
            </div>
          </div>
        </div>

        {/* Hover affordance */}
        <div className="hidden sm:flex absolute top-3 right-3 size-7 items-center justify-center rounded-full bg-primary/0 text-primary/0 group-hover/row:bg-primary group-hover/row:text-primary-foreground transition-all">
          <ArrowUpRight className="size-3.5" />
        </div>
      </Link>
    </li>
  )
}
