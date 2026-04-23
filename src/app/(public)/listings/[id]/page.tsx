import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, XCircle, MapPin, MessageCircle, Phone,
  Zap, Droplets, Flame, Waves, Scale, Ruler,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ContactForm } from './ContactForm'

const ZONE_LABELS: Record<string, string> = {
  Residential: 'Жилая',
  Commercial: 'Коммерческая',
  Agricultural: 'Сельскохозяйственная',
  'Mixed-use': 'Смешанная',
}

const ZONE_COLORS: Record<string, string> = {
  Residential: '#4BCE97',
  Commercial: '#FEA362',
  Agricultural: '#F5CD47',
  'Mixed-use': '#9F8FEF',
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: plot } = await supabase
    .from('plots')
    .select('id, address, size_sotok, price_usd_per_100sqm, zone, legal_clearance, notes, infra_electricity, infra_water, infra_gas, infra_sewer')
    .eq('id', id)
    .eq('published', true)
    .eq('archived', false)
    .single()

  if (!plot) notFound()

  const sqm = plot.size_sotok * 100
  const totalPrice = plot.price_usd_per_100sqm
    ? Math.round(plot.price_usd_per_100sqm * (sqm / 100))
    : null
  const accentColor = plot.zone ? (ZONE_COLORS[plot.zone] ?? '#94a3b8') : '#94a3b8'

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="size-4" /> Все участки
        </Link>

        {/* Hero */}
        <section className="rounded-2xl bg-card ring-1 ring-foreground/10 overflow-hidden mb-6">
          <div
            className="relative h-32 sm:h-40 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${accentColor}40 0%, ${accentColor}14 70%, transparent 100%)`,
            }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, ${accentColor}55 1px, transparent 0)`,
                backgroundSize: '20px 20px',
              }}
            />
          </div>

          <div className="relative px-6 sm:px-8 pt-6 pb-7 -mt-10">
            {plot.zone && (
              <Badge
                variant="outline"
                className="bg-card border-transparent text-foreground/80 font-medium mb-4"
                style={{ boxShadow: `inset 0 0 0 1px ${accentColor}66` }}
              >
                <span
                  className="size-1.5 rounded-full mr-1"
                  style={{ backgroundColor: accentColor }}
                />
                {ZONE_LABELS[plot.zone] ?? plot.zone}
              </Badge>
            )}

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-start gap-2.5 leading-tight">
              <MapPin className="size-6 text-primary shrink-0 mt-0.5" />
              <span className="flex-1">{plot.address}</span>
            </h1>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-8 gap-y-3 text-foreground">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Площадь</p>
                <p className="mt-0.5 text-2xl sm:text-3xl font-semibold tabular-nums">
                  {plot.size_sotok}
                  <span className="text-base font-normal text-muted-foreground ml-1.5">сот</span>
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">{sqm.toLocaleString('ru')} м²</p>
              </div>

              {totalPrice != null && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Стоимость участка</p>
                  <p className="mt-0.5 text-2xl sm:text-3xl font-semibold tabular-nums text-primary">
                    ~${totalPrice.toLocaleString('en')}
                  </p>
                  {plot.price_usd_per_100sqm != null && (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      ${plot.price_usd_per_100sqm.toLocaleString('en')} / 100 м²
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Details column */}
          <div className="space-y-6">
            {/* Parameters */}
            <div className="rounded-2xl bg-card ring-1 ring-foreground/10 p-6 sm:p-7">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
                Параметры участка
              </h2>
              <dl className="space-y-3.5">
                <ParamRow
                  icon={Ruler}
                  label="Площадь"
                  value={`${plot.size_sotok} сот · ${sqm.toLocaleString('ru')} м²`}
                />
                {plot.price_usd_per_100sqm != null && (
                  <ParamRow
                    icon={Scale}
                    label="Цена за 100 м²"
                    value={`$${plot.price_usd_per_100sqm.toLocaleString('en')}`}
                  />
                )}
                {totalPrice != null && (
                  <ParamRow
                    icon={Scale}
                    label="Итого"
                    value={`~$${totalPrice.toLocaleString('en')}`}
                    emphasize
                  />
                )}
              </dl>

              <Separator className="my-5" />

              {/* Legal clearance */}
              {plot.legal_clearance ? (
                <div className="flex items-start gap-2.5 rounded-lg bg-primary/5 ring-1 ring-primary/15 p-3.5">
                  <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-foreground">Красная книга имеется</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Документы о собственности проверены
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-lg bg-destructive/5 ring-1 ring-destructive/15 p-3.5">
                  <XCircle className="size-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-foreground">Красной книги нет</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Уточните юридический статус у менеджера
                    </p>
                  </div>
                </div>
              )}

              <Separator className="my-5" />

              {/* Infrastructure */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Инфраструктура
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <InfraPill icon={Zap}      label="Электричество" value={plot.infra_electricity} />
                  <InfraPill icon={Droplets} label="Вода"          value={plot.infra_water}       />
                  <InfraPill icon={Flame}    label="Газ"           value={plot.infra_gas}         />
                  <InfraPill icon={Waves}    label="Канализация"   value={plot.infra_sewer}       />
                </div>
              </div>
            </div>

            {/* Description */}
            {plot.notes && (
              <div className="rounded-2xl bg-card ring-1 ring-foreground/10 p-6 sm:p-7">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Описание
                </h2>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {plot.notes}
                </p>
              </div>
            )}
          </div>

          {/* Contact sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary/85 text-primary-foreground p-6 sm:p-7 shadow-lg shadow-primary/15">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-primary-foreground/15 backdrop-blur-sm font-bold text-base shrink-0">
                  УК
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Uchastok.kg</p>
                  <p className="text-primary-foreground/75 text-xs">Менеджер по продажам</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <a
                  href="https://wa.me/996997902903"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-foreground/15 hover:bg-primary-foreground/25 backdrop-blur-sm text-primary-foreground text-sm font-medium h-10 transition-colors"
                >
                  <MessageCircle className="size-4" />
                  WhatsApp
                </a>
                <a
                  href="tel:+996997902903"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-foreground text-primary text-sm font-semibold h-10 hover:bg-primary-foreground/90 transition-colors"
                >
                  <Phone className="size-4" />
                  Позвонить
                </a>
              </div>

              <div className="my-5 h-px bg-primary-foreground/15" />

              <p className="font-semibold text-sm">Перезвоним вам</p>
              <p className="mt-0.5 text-xs text-primary-foreground/75 mb-3.5">
                Оставьте номер — свяжемся в течение часа
              </p>
              <ContactForm />
            </div>

            <p className="mt-4 px-1 text-[11px] text-muted-foreground leading-relaxed text-center">
              Отправляя форму, вы соглашаетесь на&nbsp;обработку персональных данных.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}

function ParamRow({
  icon: Icon,
  label,
  value,
  emphasize,
}: {
  icon: React.ElementType
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm gap-4">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      <span className={
        emphasize
          ? 'font-semibold text-primary tabular-nums'
          : 'font-medium text-foreground tabular-nums'
      }>
        {value}
      </span>
    </div>
  )
}

function InfraPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: boolean | null
}) {
  const known = value === true || value === false
  return (
    <div
      className={
        'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ring-1 ' + (
          value === true
            ? 'bg-accent/5 ring-accent/20 text-foreground'
            : value === false
              ? 'bg-muted ring-border text-muted-foreground'
              : 'bg-muted ring-border text-muted-foreground'
        )
      }
    >
      <Icon className={'size-4 shrink-0 ' + (value === true ? 'text-accent' : 'text-muted-foreground/60')} />
      <span className={'font-medium flex-1 ' + (value === false ? 'line-through' : '')}>{label}</span>
      {known && value === true && <CheckCircle2 className="size-3.5 text-accent" />}
      {!known && <span className="text-xs text-muted-foreground/60">?</span>}
    </div>
  )
}
