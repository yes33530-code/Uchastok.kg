import { MapPin, ShieldCheck, Scale, Network } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ListingsClient } from './ListingsClient'

export const metadata = { title: 'Участки — Uchastok.kg' }

export default async function ListingsPage() {
  const supabase = await createClient()
  const { data: plots } = await supabase
    .from('plots')
    .select('id, address, size_sotok, price_usd_per_100sqm, zone, legal_clearance, notes, infra_electricity, infra_water, infra_gas, infra_sewer')
    .eq('published', true)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  const list = plots ?? []

  const prices = list.map(p => p.price_usd_per_100sqm).filter((p): p is number => p != null)
  const minPrice = prices.length ? Math.min(...prices) : null
  const maxPrice = prices.length ? Math.max(...prices) : null
  const avgSize = list.length ? Math.round(list.reduce((s, p) => s + p.size_sotok, 0) / list.length) : 0

  return (
    <div className="px-4 sm:px-6 pt-12 sm:pt-16 pb-10">
      <div className="max-w-6xl mx-auto">

        {/* Hero */}
        <section className="mb-10 sm:mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary mb-3">
            Каталог • Кыргызстан
          </p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-foreground max-w-2xl leading-[1.1]">
            Земельные участки с&nbsp;<span className="text-primary">проверенными документами</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {list.length > 0
              ? `${list.length} ${pluralRu(list.length, ['актуальное предложение', 'актуальных предложения', 'актуальных предложений'])}. Красная книга, инженерные сети, зонирование — всё прозрачно.`
              : 'Скоро здесь появятся новые предложения.'}
          </p>

          {/* Trust chips */}
          <div className="mt-6 flex flex-wrap gap-2 text-xs sm:text-sm">
            <TrustChip icon={ShieldCheck} label="Юридическая проверка" />
            <TrustChip icon={Scale} label="Фиксированная цена" />
            <TrustChip icon={Network} label="Инфраструктура на месте" />
          </div>

          {/* Stats strip */}
          {list.length > 0 && (
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <Stat label="Всего участков" value={String(list.length)} />
              {avgSize > 0 && <Stat label="Средний размер" value={`${avgSize} сот`} />}
              {minPrice != null && maxPrice != null && (
                <Stat
                  label="Цена / 100 м²"
                  value={minPrice === maxPrice
                    ? `$${minPrice.toLocaleString('en')}`
                    : `от $${minPrice.toLocaleString('en')}`}
                />
              )}
              <Stat label="Регион" value="Бишкек и окрестности" />
            </div>
          )}
        </section>

        {list.length === 0 ? (
          <EmptyState />
        ) : (
          <ListingsClient plots={list} />
        )}

      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-card ring-1 ring-foreground/5 text-center py-24 px-6">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <MapPin className="size-5 text-muted-foreground" />
      </div>
      <p className="font-medium text-foreground">Нет доступных участков</p>
      <p className="mt-1 text-sm text-muted-foreground">Загляните позже — скоро появятся новые предложения</p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl sm:text-2xl font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  )
}

function TrustChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-medium text-foreground/80">
      <Icon className="size-3.5 text-primary" />
      {label}
    </span>
  )
}

function pluralRu(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}
