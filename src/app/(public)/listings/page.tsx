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
    <div className="px-4 sm:px-6 pt-6 pb-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="mb-3 text-lg sm:text-xl font-semibold tracking-tight text-foreground">
          Каталог участков
        </h1>

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
    <div className="rounded-lg border border-border bg-card ring-1 ring-foreground/5 text-center py-24 px-6">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <MapPin className="size-5 text-muted-foreground" />
      </div>
      <p className="font-medium text-foreground">Нет записей</p>
      <p className="mt-1 text-sm text-muted-foreground">Загляните позже</p>
    </div>
  )
}
