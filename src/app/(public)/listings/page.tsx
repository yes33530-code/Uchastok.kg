import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from './ListingCard'

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Земельные участки</h1>
        <p className="text-gray-500">
          {list.length > 0
            ? `${list.length} участок${list.length === 1 ? '' : list.length < 5 ? 'а' : 'ов'} в продаже`
            : 'Скоро появятся новые предложения'}
        </p>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Нет доступных участков</p>
          <p className="text-sm mt-1">Загляните позже — скоро появятся новые предложения</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {list.map((plot) => (
            <ListingCard key={plot.id} plot={plot} />
          ))}
        </div>
      )}
    </div>
  )
}
