import Link from 'next/link'
import { MapPin, CheckCircle, XCircle, Zap, Droplets, Flame, Waves } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Участки — Uchastok.kg' }

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <div className="mb-10">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((plot) => (
            <Link
              key={plot.id}
              href={`/listings/${plot.id}`}
              className="group bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-150 overflow-hidden"
            >
              <div className="h-1.5 bg-indigo-500 group-hover:bg-indigo-600 transition-colors" />

              <div className="p-5">
                {plot.zone && (
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3 ${ZONE_COLORS[plot.zone] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ZONE_LABELS[plot.zone] ?? plot.zone}
                  </span>
                )}

                <h2 className="font-semibold text-gray-900 text-sm leading-snug mb-3 group-hover:text-indigo-700 transition-colors">
                  {plot.address}
                </h2>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Площадь</span>
                  <span className="font-medium text-gray-700">{plot.size_sotok} сот. ({(plot.size_sotok * 100).toLocaleString('ru')} м²)</span>
                </div>

                {plot.price_usd_per_100sqm && (
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-400">Цена</span>
                    <span className="font-medium text-gray-700">${plot.price_usd_per_100sqm.toLocaleString('en')} / 100 м²</span>
                  </div>
                )}

                {plot.notes && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                    {plot.notes}
                  </p>
                )}

                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    {plot.legal_clearance
                      ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600 font-medium">Красная книга есть</span></>
                      : <><XCircle className="w-3.5 h-3.5 text-red-400" /><span className="text-red-500 font-medium">Красной книги нет</span></>
                    }
                  </div>
                  <InfraIcons plot={plot} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

type InfraPlot = { infra_electricity: boolean | null; infra_water: boolean | null; infra_gas: boolean | null; infra_sewer: boolean | null }

function InfraIcons({ plot }: { plot: InfraPlot }) {
  const items = [
    { key: 'infra_electricity', icon: Zap,     label: 'Электричество' },
    { key: 'infra_water',       icon: Droplets, label: 'Вода' },
    { key: 'infra_gas',         icon: Flame,    label: 'Газ' },
    { key: 'infra_sewer',        icon: Waves,    label: 'Канализация' },
  ] as const

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(({ key, icon: Icon, label }) => {
        const val = plot[key]
        return (
          <span
            key={key}
            title={label}
            className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md font-medium ${
              val === true  ? 'bg-emerald-50 text-emerald-700' :
              val === false ? 'bg-red-50 text-red-400 line-through' :
                              'bg-gray-100 text-gray-400'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </span>
        )
      })}
    </div>
  )
}
