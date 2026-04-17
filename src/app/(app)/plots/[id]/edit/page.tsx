import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { PlotForm } from '@/components/plots/plot-form'
import { EditBackdrop } from '@/components/plots/edit-backdrop'

export const metadata = { title: 'Редактировать участок — Uchastok.kg' }

export default async function EditPlotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: plot }, { data: stages }, { data: members }] = await Promise.all([
    supabase.from('plots').select('*').eq('id', id).single(),
    supabase.from('kanban_stages').select('*').order('position'),
    supabase.from('profiles').select('*').order('full_name'),
  ])

  if (!plot) notFound()

  return (
    <>
      <Topbar title="Редактировать участок" />
      <EditBackdrop>
        <PlotForm plot={plot} stages={stages ?? []} members={members ?? []} />
      </EditBackdrop>
    </>
  )
}
