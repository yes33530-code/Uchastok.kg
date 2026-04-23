'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Plot, KanbanStage, Profile } from '@/types/plot'
import { createPlot, updatePlot } from '@/actions/plots'

const plotSchema = z.object({
  address: z.string().min(3, 'Минимум 3 символа'),
  location_details: z.string().optional(),
  infra_electricity: z.boolean().optional(),
  infra_water: z.boolean().optional(),
  infra_gas: z.boolean().optional(),
  infra_sewer: z.boolean().optional(),
  size_sotok: z.string().min(1, 'Обязательно'),
  price_usd_per_100sqm: z.string().optional(),
  owner_share_pct: z.string().default('0'),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().optional(),
  project_duration_months: z.string().optional(),
  legal_clearance: z.boolean().default(false),
  zone: z.string().optional(),
  stage_id: z.string().optional(),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
})

type PlotFormValues = z.infer<typeof plotSchema>

function toPlotData(data: PlotFormValues) {
  return {
    address: data.address,
    size_sotok: parseFloat(data.size_sotok) || 0,
    price_usd_per_100sqm: data.price_usd_per_100sqm ? parseFloat(data.price_usd_per_100sqm) : null,
    owner_share_pct: parseFloat(data.owner_share_pct) || 0,
    contact_name: data.contact_name || null,
    contact_phone: data.contact_phone || null,
    contact_email: data.contact_email || null,
    project_duration_months: data.project_duration_months ? parseInt(data.project_duration_months) : null,
    legal_clearance: data.legal_clearance ?? false,
    zone: (data.zone as Plot['zone']) || null,
    stage_id: data.stage_id || null,
    assigned_to: data.assigned_to || null,
    notes: data.notes || null,
    location_details: data.location_details || null,
    infra_electricity: data.infra_electricity ?? null,
    infra_water: data.infra_water ?? null,
    infra_gas: data.infra_gas ?? null,
    infra_sewer: data.infra_sewer ?? null,
  }
}

interface PlotFormProps {
  plot?: Plot
  stages: KanbanStage[]
  members: Profile[]
}

const ZONES = [
  { value: 'Residential', label: 'Жилая' },
  { value: 'Commercial', label: 'Коммерческая' },
  { value: 'Agricultural', label: 'Сельскохозяйственная' },
  { value: 'Mixed-use', label: 'Смешанная' },
]

export function PlotForm({ plot, stages, members }: PlotFormProps) {
  const router = useRouter()
  const isEdit = !!plot

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PlotFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(plotSchema) as any,
    defaultValues: plot ? {
      address: plot.address,
      size_sotok: String(plot.size_sotok),
      price_usd_per_100sqm: plot.price_usd_per_100sqm != null ? String(plot.price_usd_per_100sqm) : '',
      owner_share_pct: String(plot.owner_share_pct),
      contact_name: plot.contact_name ?? '',
      contact_phone: plot.contact_phone ?? '',
      contact_email: plot.contact_email ?? '',
      project_duration_months: plot.project_duration_months != null ? String(plot.project_duration_months) : '',
      legal_clearance: plot.legal_clearance,
      zone: plot.zone ?? '',
      stage_id: plot.stage_id ?? '',
      assigned_to: plot.assigned_to ?? '',
      notes: plot.notes ?? '',
      location_details: plot.location_details ?? '',
      infra_electricity: plot.infra_electricity ?? undefined,
      infra_water: plot.infra_water ?? undefined,
      infra_gas: plot.infra_gas ?? undefined,
      infra_sewer: plot.infra_sewer ?? undefined,
    } : {
      owner_share_pct: '0',
      legal_clearance: false,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    data = data as PlotFormValues
    const plotData = toPlotData(data)
    try {
      if (isEdit) {
        await updatePlot(plot.id, plotData)
        toast.success('Участок обновлён')
        router.push(`/plots/${plot.id}`)
      } else {
        const created = await createPlot(plotData)
        toast.success('Участок создан')
        router.push(`/plots/${created.id}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-[18px] font-semibold text-foreground leading-tight">
          {isEdit ? 'Редактировать участок' : 'Новый участок'}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {isEdit ? 'Внесите изменения и сохраните.' : 'Заполните поля и создайте карточку.'}
        </p>
      </div>

      {/* Basic Info */}
      <section>
        <SectionLabel>Основная информация</SectionLabel>
        <Panel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
            <Field label="Адрес *" error={errors.address?.message} className="md:col-span-2">
              <input {...register('address')} placeholder="г. Бишкек, ул. Примерная, 1" className={inputCls} />
            </Field>
            <Field label="Площадь (сотки) *" error={errors.size_sotok?.message}>
              <input {...register('size_sotok')} type="number" step="0.01" className={inputCls} />
            </Field>
            <Field label="Цена (USD / 100 м²)" error={errors.price_usd_per_100sqm?.message}>
              <input {...register('price_usd_per_100sqm')} type="number" step="0.01" className={inputCls} />
            </Field>
            <Field label="Доля собственника (%)" error={errors.owner_share_pct?.message}>
              <input {...register('owner_share_pct')} type="number" step="0.1" min="0" max="100" className={inputCls} />
            </Field>
            <Field label="Тип зоны" error={errors.zone?.message}>
              <select {...register('zone')} className={inputCls}>
                <option value="">— Выбрать —</option>
                {ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
              </select>
            </Field>
            <Field label="Длительность проекта (мес.)" error={errors.project_duration_months?.message}>
              <input {...register('project_duration_months')} type="number" min="1" className={inputCls} />
            </Field>
            <div className="md:col-span-2 flex items-center gap-2 pt-1">
              <input {...register('legal_clearance')} type="checkbox" id="legal_clearance" className="w-4 h-4 rounded accent-primary" />
              <label htmlFor="legal_clearance" className="text-[13px] text-foreground/80">Красная книга (право собственности)</label>
            </div>
          </div>
        </Panel>
      </section>

      {/* Infrastructure */}
      <section>
        <SectionLabel>Инфраструктура</SectionLabel>
        <Panel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              { field: 'infra_electricity', label: 'Электричество' },
              { field: 'infra_water',       label: 'Водоснабжение' },
              { field: 'infra_gas',         label: 'Газ' },
              { field: 'infra_sewer',        label: 'Канализация' },
            ] as const).map(({ field, label }) => (
              <label key={field} className="flex items-center gap-2.5 cursor-pointer select-none">
                <input {...register(field)} type="checkbox" className="w-4 h-4 rounded accent-primary" />
                <span className="text-[13px] text-foreground/80">{label}</span>
              </label>
            ))}
          </div>
        </Panel>
      </section>

      {/* Precise location */}
      <section>
        <SectionLabel>Точное местоположение</SectionLabel>
        <Panel>
          <Field label="Ориентиры" error={errors.location_details?.message}>
            <input {...register('location_details')} placeholder="Пр. Манаса, 100, рядом с рынком Ош базар" className={inputCls} />
          </Field>
        </Panel>
      </section>

      {/* Contact */}
      <section>
        <SectionLabel>Контакт</SectionLabel>
        <Panel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-3">
            <Field label="Имя" error={errors.contact_name?.message}>
              <input {...register('contact_name')} className={inputCls} />
            </Field>
            <Field label="Телефон" error={errors.contact_phone?.message}>
              <input {...register('contact_phone')} className={inputCls} />
            </Field>
            <Field label="Email" error={errors.contact_email?.message}>
              <input {...register('contact_email')} type="email" className={inputCls} />
            </Field>
          </div>
        </Panel>
      </section>

      {/* Pipeline */}
      <section>
        <SectionLabel>Воронка</SectionLabel>
        <Panel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
            <Field label="Стадия" error={errors.stage_id?.message}>
              <select {...register('stage_id')} className={inputCls}>
                <option value="">— Без стадии —</option>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Ответственный" error={errors.assigned_to?.message}>
              <select {...register('assigned_to')} className={inputCls}>
                <option value="">— Не назначен —</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name ?? m.id}</option>)}
              </select>
            </Field>
          </div>
        </Panel>
      </section>

      {/* Notes */}
      <section>
        <SectionLabel>Заметки</SectionLabel>
        <Panel>
          <textarea
            {...register('notes')}
            rows={4}
            className="w-full text-[13px] text-foreground border-0 outline-none resize-none placeholder:text-muted-foreground/50 bg-transparent"
            placeholder="Дополнительная информация..."
          />
          {errors.notes?.message && <p className="mt-1 text-[11px] text-destructive">{errors.notes.message}</p>}
        </Panel>
      </section>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center h-9 px-4 rounded-md text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать участок'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center h-9 px-4 rounded-md text-[13px] font-medium text-foreground/80 hover:text-foreground bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
        >
          Отмена
        </button>
      </div>
    </form>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">{children}</h4>
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md p-4 bg-[var(--list)]/60 border border-border">{children}</div>
}

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[11px] text-muted-foreground mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  )
}

const inputCls = 'w-full rounded-md px-3 py-1.5 text-[13px] text-foreground outline-none focus:ring-2 focus:ring-ring/40 bg-card placeholder:text-muted-foreground/50 focus:border-ring [&>option]:bg-popover [&>option]:text-foreground border border-border transition-colors'
