import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ListingRow } from './ListingRow'

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
    <div className="min-h-screen bg-[#E4F0F6] px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto">

        {/* Hero card */}
        <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-sm px-6 py-5 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Земельные участки</h1>
          <p className="text-sm text-gray-500">
            {list.length > 0
              ? `${list.length} участок${list.length === 1 ? '' : list.length < 5 ? 'а' : 'ов'} в продаже`
              : 'Скоро появятся новые предложения'}
          </p>
        </div>

        {list.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-sm text-center py-24 text-gray-400">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Нет доступных участков</p>
            <p className="text-sm mt-1">Загляните позже — скоро появятся новые предложения</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((plot) => (
              <ListingRow key={plot.id} plot={plot} />
            ))}
          </ul>
        )}

      </div>
    </div>
  )
}
