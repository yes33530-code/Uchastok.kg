import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, MapPin, MessageCircle, Zap, Droplets, Flame, Waves } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ContactForm } from './ContactForm'

const ZONE_LABELS: Record<string, string> = {
  Residential: 'Жилая',
  Commercial: 'Коммерческая',
  Agricultural: 'Сельскохозяйственная',
  'Mixed-use': 'Смешанная',
}

const ZONE_COLORS: Record<string, string> = {
  Residential: 'bg-blue-100 text-blue-700',
  Commercial: 'bg-orange-100 text-orange-700',
  Agricultural: 'bg-green-100 text-green-700',
  'Mixed-use': 'bg-purple-100 text-purple-700',
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/listings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Все участки
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
        <div className="h-2 bg-indigo-500" />
        <div className="p-6">
          {plot.zone && (
            <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-3 ${ZONE_COLORS[plot.zone] ?? 'bg-gray-100 text-gray-600'}`}>
              {ZONE_LABELS[plot.zone] ?? plot.zone}
            </span>
          )}
          <h1 className="text-xl font-bold text-gray-900 flex items-start gap-2">
            <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            {plot.address}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Параметры участка</h2>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Площадь</span>
            <span className="font-medium text-gray-800">{plot.size_sotok} сот. ({sqm.toLocaleString('ru')} м²)</span>
          </div>

          {plot.price_usd_per_100sqm && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Цена / 100 м²</span>
              <span className="font-medium text-gray-800">${plot.price_usd_per_100sqm.toLocaleString('en')}</span>
            </div>
          )}

          {totalPrice && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Стоимость участка</span>
              <span className="font-semibold text-indigo-600">~${totalPrice.toLocaleString('en')}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm pt-1">
            {plot.legal_clearance
              ? <><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /><span className="text-emerald-700 font-medium">Красная книга имеется</span></>
              : <><XCircle className="w-4 h-4 text-red-400 shrink-0" /><span className="text-red-600 font-medium">Красной книги нет</span></>
            }
          </div>

          <InfraRow plot={plot} />

          {plot.notes && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Описание</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{plot.notes}</p>
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <div className="bg-indigo-600 rounded-2xl p-6 flex flex-col gap-5 text-white">
          {/* Agent card */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              УК
            </div>
            <div>
              <p className="font-semibold text-sm">Uchastok.kg</p>
              <p className="text-indigo-300 text-xs">Менеджер по продажам</p>
            </div>
            <a
              href="https://wa.me/996997902903"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 transition-colors text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          </div>

          <div className="border-t border-indigo-500" />

          {/* Callback form */}
          <div>
            <p className="text-sm font-semibold mb-1">Перезвоним вам</p>
            <p className="text-indigo-300 text-xs mb-3">Оставьте номер — свяжемся в течение часа</p>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
}

type InfraPlot = { infra_electricity: boolean | null; infra_water: boolean | null; infra_gas: boolean | null; infra_sewer: boolean | null }

function InfraRow({ plot }: { plot: InfraPlot }) {
  const items = [
    { key: 'infra_electricity', icon: Zap,     label: 'Электричество' },
    { key: 'infra_water',       icon: Droplets, label: 'Вода' },
    { key: 'infra_gas',         icon: Flame,    label: 'Газ' },
    { key: 'infra_sewer',        icon: Waves,    label: 'Канализация' },
  ] as const

  return (
    <div className="pt-3 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Инфраструктура</p>
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ key, icon: Icon, label }) => {
          const val = plot[key]
          return (
            <div
              key={key}
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                val === true  ? 'bg-emerald-50 text-emerald-700' :
                val === false ? 'bg-red-50 text-red-500' :
                                'bg-gray-50 text-gray-400'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className={`font-medium ${val === false && 'line-through'}`}>{label}</span>
              {val === null && <span className="ml-auto text-xs opacity-60">?</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
