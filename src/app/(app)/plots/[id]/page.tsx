import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { ScoreBadge } from '@/components/ui/score-badge'
import { ArchiveButton } from '@/components/plots/archive-button'
import { PublishButton } from '@/components/plots/publish-button'
import { ProfitCalculator } from '@/components/calculator/profit-calculator'
import { ChecklistPanel } from '@/components/automations/checklist-panel'
import { ScoringInputsForm } from '@/components/plots/scoring-inputs-form'
import { FileAttachments } from '@/components/plots/file-attachments'
import { ActivityPanel } from '@/components/plots/activity-panel'
import { formatSotok, formatUSD, formatDate } from '@/lib/utils'

export default async function PlotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: plot }, { data: snapshot }, { data: si }, { data: checklists }, { data: files }, { data: userProfile }] = await Promise.all([
    supabase.from('plots').select('*').eq('id', id).single(),
    supabase.from('calculator_snapshots').select('*').eq('plot_id', id).maybeSingle(),
    supabase.from('scoring_inputs').select('*').eq('plot_id', id).maybeSingle(),
    supabase.from('plot_checklists').select('*').eq('plot_id', id).order('created_at'),
    supabase.from('plot_files').select('*').eq('plot_id', id).order('created_at'),
    user ? supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single() : Promise.resolve({ data: null }),
  ])

  if (!plot) notFound()

  const { data: plotStage } = plot.stage_id
    ? await supabase.from('kanban_stages').select('*').eq('id', plot.stage_id).single()
    : { data: null }

  const ZONE_LABELS: Record<string, string> = {
    Residential: 'Жилая',
    Commercial: 'Коммерческая',
    Agricultural: 'Сельскохозяйственная',
    'Mixed-use': 'Смешанная',
  }

  return (
    <>
      <Topbar title={plot.address} />
      <main className="flex-1 overflow-y-auto p-3 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back */}
          <Link href="/plots" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Все участки
          </Link>

          {/* Header */}
          <div className="rounded-xl p-6" style={{ backgroundColor: '#142a50', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h2 className="text-xl font-bold text-white">{plot.address}</h2>
                  <ScoreBadge score={plot.score} size="md" />
                  {plot.archived && (
                    <span className="bg-amber-500/15 text-amber-400 text-xs font-medium px-2.5 py-1 rounded-full">Архив</span>
                  )}
                  {plotStage && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: plotStage.color }}>
                      {plotStage.name}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/40">Добавлен {formatDate(plot.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Link
                  href={`/plots/${plot.id}/edit`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white/60 hover:text-white/90 hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <Pencil className="w-3.5 h-3.5" /> Изменить
                </Link>
                <PublishButton plotId={plot.id} published={plot.published} />
                <ArchiveButton plotId={plot.id} archived={plot.archived} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-1 space-y-6">
              <InfoCard title="Параметры участка">
                <InfoRow label="Площадь" value={formatSotok(plot.size_sotok)} />
                <InfoRow label="Цена / 100 м²" value={formatUSD(plot.price_usd_per_100sqm)} />
                {plot.location_details && (
                  <InfoRow label="Ориентиры" value={plot.location_details} />
                )}
                <InfoRow label="Доля собственника" value={`${plot.owner_share_pct}%`} />
                <InfoRow label="Зона" value={plot.zone ? ZONE_LABELS[plot.zone] ?? plot.zone : '—'} />
                <InfoRow label="Красная книга" value={plot.legal_clearance ? '✅ Да' : '❌ Нет'} />
                <InfoRow label="Длительность проекта" value={plot.project_duration_months ? `${plot.project_duration_months} мес.` : '—'} />
              </InfoCard>

              {(plot.infra_electricity != null || plot.infra_water != null || plot.infra_gas != null || plot.infra_sewer != null) && (
                <InfoCard title="Инфраструктура">
                  <InfoRow label="Свет"         value={plot.infra_electricity ? '✅ Есть' : '❌ Нет'} />
                  <InfoRow label="Вода"         value={plot.infra_water       ? '✅ Есть' : '❌ Нет'} />
                  <InfoRow label="Газ"          value={plot.infra_gas         ? '✅ Есть' : '❌ Нет'} />
                  <InfoRow label="Канализация"  value={plot.infra_sewer       ? '✅ Есть' : '❌ Нет'} />
                </InfoCard>
              )}

              <InfoCard title="Контакт">
                <InfoRow label="Имя" value={plot.contact_name} />
                <InfoRow label="Телефон" value={plot.contact_phone} />
                <InfoRow label="Email" value={plot.contact_email} />
              </InfoCard>

              {plot.notes && (
                <InfoCard title="Заметки">
                  <p className="text-sm text-white/70 whitespace-pre-wrap">{plot.notes}</p>
                </InfoCard>
              )}

              <ScoringInputsForm
                plotId={plot.id}
                initialValues={si}
                initialInfra={{
                  infra_electricity: plot.infra_electricity,
                  infra_water:       plot.infra_water,
                  infra_gas:         plot.infra_gas,
                  infra_sewer:       plot.infra_sewer,
                }}
              />
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl p-5" style={{ backgroundColor: '#142a50', border: '1px solid rgba(255,255,255,0.08)' }}>
                <ProfitCalculator
                  plotId={plot.id}
                  ownerSharePct={plot.owner_share_pct}
                  durationMonths={plot.project_duration_months}
                  snapshot={snapshot}
                  userId={user?.id ?? ''}
                  dark
                />
              </div>

              <FileAttachments plotId={plot.id} initialFiles={files ?? []} dark />

              {(checklists ?? []).length > 0 && (
                <div className="rounded-xl p-5" style={{ backgroundColor: '#142a50', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <ChecklistPanel checklists={checklists ?? []} userId={user?.id ?? ''} />
                </div>
              )}

              <ActivityPanel plotId={plot.id} userId={user?.id ?? ''} userProfile={userProfile} />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#142a50', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 className="text-sm font-semibold text-white/70 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className="text-white/40 shrink-0">{label}</span>
      <span className="text-white/80 font-medium text-right">{value ?? '—'}</span>
    </div>
  )
}
