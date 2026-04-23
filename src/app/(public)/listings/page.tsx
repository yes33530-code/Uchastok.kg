import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ListingsClient } from './ListingsClient'

export const metadata = { title: 'Каталог участков — Uchastok.kg' }

export default async function ListingsPage() {
  const supabase = await createClient()
  const { data: plots } = await supabase
    .from('plots')
    .select('id, address, size_sotok, price_usd_per_100sqm, zone, legal_clearance, notes, infra_electricity, infra_water, infra_gas, infra_sewer')
    .eq('published', true)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  const list = plots ?? []

  return (
    <div className="px-4 sm:px-6 pt-10 sm:pt-12 pb-10">
      <div className="max-w-6xl mx-auto">

        {/* Hero */}
        <section className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary mb-3">
            Каталог участков
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground leading-[1.15]">
            База земельных участков
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-2xl">
            {list.length > 0
              ? `${list.length} ${pluralRu(list.length, ['запись', 'записи', 'записей'])} — размер, инженерные сети, зонирование и статус документов по каждому участку.`
              : 'Записи отсутствуют.'}
          </p>
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
      <p className="font-medium text-foreground">Нет записей</p>
      <p className="mt-1 text-sm text-muted-foreground">Загляните позже</p>
    </div>
  )
}

function pluralRu(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}
