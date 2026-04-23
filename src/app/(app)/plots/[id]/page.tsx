import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil, ArrowLeft, Check, X, CreditCard, Tag, Calculator } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ScoreBadge } from '@/components/ui/score-badge'
import { ArchiveButton } from '@/components/plots/archive-button'
import { PublishButton } from '@/components/plots/publish-button'
import { ProfitCalculator } from '@/components/calculator/profit-calculator'
import { ChecklistPanel } from '@/components/automations/checklist-panel'
import { ScoringInputsForm } from '@/components/plots/scoring-inputs-form'
import { FileAttachments } from '@/components/plots/file-attachments'
import { ActivityPanel } from '@/components/plots/activity-panel'
import { formatSotok, formatUSD, formatDate } from '@/lib/utils'

type LabelItem = { name: string; color: string }

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

  const labels: LabelItem[] = Array.isArray(plot.labels)
    ? (plot.labels as unknown as LabelItem[]).filter(l => l && typeof l.name === 'string' && typeof l.color === 'string')
    : []

  const hasInfra = plot.infra_electricity != null || plot.infra_water != null || plot.infra_gas != null || plot.infra_sewer != null
  const hasContact = plot.contact_name || plot.contact_phone || plot.contact_email

  return (
    <main className="flex-1 overflow-y-auto p-3 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <Link
          href="/plots"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Все участки
        </Link>

        {/* Card-back shell */}
        <div className="rounded-lg bg-card ring-1 ring-white/[0.08] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative px-6 pt-5 pb-4">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 flex-wrap justify-end">
              <Link
                href={`/plots/${plot.id}/edit`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium text-foreground/90 bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Изменить
              </Link>
              <PublishButton plotId={plot.id} published={plot.published} />
              <ArchiveButton plotId={plot.id} archived={plot.archived} />
            </div>
            <div className="flex items-start gap-3 pr-[280px] md:pr-[320px]">
              <CreditCard className="w-5 h-5 text-muted-foreground mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-[20px] font-semibold text-foreground leading-tight">{plot.address}</h2>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  {plotStage ? (
                    <>
                      в колонке{' '}
                      <span className="inline-flex items-center gap-1 text-foreground/90">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: plotStage.color }}
                        />
                        {plotStage.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground/70">без стадии</span>
                  )}
                  {plot.archived && (
                    <span className="ml-2 inline-flex items-center bg-amber-500/15 text-amber-300 text-[11px] font-medium px-2 py-0.5 rounded">
                      Архив
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Body: main + sidebar */}
          <div className="flex flex-col md:flex-row md:items-stretch">
            {/* ── Main column ── */}
            <div className="flex-1 min-w-0 px-6 pb-6 pt-1 space-y-5">
              {/* Metadata row: labels + score + added */}
              <div className="flex flex-wrap gap-4 items-start">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 inline-flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> Метки
                  </h4>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {labels.length === 0 && (
                      <span className="text-[12px] text-muted-foreground/60">—</span>
                    )}
                    {labels.map((lbl, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-[11px] font-semibold h-6 px-2 rounded"
                        style={{ backgroundColor: lbl.color, color: readableInk(lbl.color) }}
                      >
                        {lbl.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Оценка</h4>
                  <ScoreBadge score={plot.score} size="sm" />
                </div>
                <div className="shrink-0">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Добавлен</h4>
                  <p className="text-[13px] text-foreground tabular-nums">{formatDate(plot.created_at)}</p>
                </div>
              </div>

              {/* Details */}
              <section>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Детали</h4>
                <div className="rounded-md p-4 bg-[var(--list)]/60 border border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                    <InfoRow label="Площадь" value={formatSotok(plot.size_sotok)} />
                    <InfoRow label="Цена / 100 м²" value={formatUSD(plot.price_usd_per_100sqm)} />
                    <InfoRow label="Доля собственника" value={`${plot.owner_share_pct}%`} />
                    <InfoRow label="Зона" value={plot.zone ? ZONE_LABELS[plot.zone] ?? plot.zone : '—'} />
                    <InfoRow label="Красная книга" value={plot.legal_clearance} bool />
                    <InfoRow
                      label="Длительность"
                      value={plot.project_duration_months ? `${plot.project_duration_months} мес.` : '—'}
                    />
                    {plot.location_details && (
                      <div className="sm:col-span-2">
                        <InfoRow label="Ориентиры" value={plot.location_details} />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Infrastructure */}
              {hasInfra && (
                <section>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Инфраструктура</h4>
                  <div className="rounded-md p-4 bg-[var(--list)]/60 border border-border">
                    <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                      <InfoRow label="Свет"        value={plot.infra_electricity} bool />
                      <InfoRow label="Вода"        value={plot.infra_water}       bool />
                      <InfoRow label="Газ"         value={plot.infra_gas}         bool />
                      <InfoRow label="Канализация" value={plot.infra_sewer}       bool />
                    </div>
                  </div>
                </section>
              )}

              {/* Contact */}
              {hasContact && (
                <section>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Контакт</h4>
                  <div className="rounded-md p-4 bg-[var(--list)]/60 border border-border">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-3">
                      <InfoRow label="Имя" value={plot.contact_name} />
                      <InfoRow label="Телефон" value={plot.contact_phone} />
                      <InfoRow label="Email" value={plot.contact_email} />
                    </div>
                  </div>
                </section>
              )}

              {/* Description */}
              {plot.notes && (
                <section>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Описание</h4>
                  <div className="rounded-md p-3 bg-[var(--list)]/60 border border-border">
                    <p className="text-[13px] text-foreground/90 whitespace-pre-wrap leading-relaxed">{plot.notes}</p>
                  </div>
                </section>
              )}

              {/* Calculator */}
              <section>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 inline-flex items-center gap-1.5">
                  <Calculator className="w-3 h-3" /> Калькулятор доходности
                </h4>
                <div className="rounded-md p-4 bg-[var(--list)]/60 border border-border">
                  <ProfitCalculator
                    plotId={plot.id}
                    ownerSharePct={plot.owner_share_pct}
                    durationMonths={plot.project_duration_months}
                    snapshot={snapshot}
                    userId={user?.id ?? ''}
                  />
                </div>
              </section>

              {/* Scoring */}
              <section>
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
              </section>

              {/* Files */}
              <section id="attachments">
                <FileAttachments plotId={plot.id} initialFiles={files ?? []} />
              </section>

              {/* Checklists */}
              {(checklists ?? []).length > 0 && (
                <section>
                  <ChecklistPanel checklists={checklists ?? []} userId={user?.id ?? ''} />
                </section>
              )}
            </div>

            {/* Divider */}
            <div className="hidden md:block shrink-0 w-px bg-border" />
            <div className="md:hidden h-px mx-6 bg-border" />

            {/* ── Right column: Activity ── */}
            <aside className="md:w-[320px] shrink-0 bg-[var(--list)]/40">
              <ActivityPanel plotId={plot.id} userId={user?.id ?? ''} userProfile={userProfile} sidebar />
            </aside>
          </div>
        </div>
      </div>
    </main>
  )
}

function InfoRow({ label, value, bool }: { label: string; value: string | number | boolean | null | undefined; bool?: boolean }) {
  const display: React.ReactNode =
    bool
      ? (value
          ? <span className="inline-flex items-center gap-1 text-primary"><Check className="w-3.5 h-3.5" /> Да</span>
          : <span className="inline-flex items-center gap-1 text-muted-foreground"><X className="w-3.5 h-3.5" /> Нет</span>)
      : (value ?? '—')

  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-[13px] text-foreground font-medium">{display}</p>
    </div>
  )
}

/** Pick black/white ink for a given hex bg so label text stays legible. */
function readableInk(hex: string): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return '#fff'
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#1D2125' : '#fff'
}
