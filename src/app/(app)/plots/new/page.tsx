import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { PlotForm } from '@/components/plots/plot-form'

export const metadata = { title: 'Новый участок — Uchastok.kg' }

export default async function NewPlotPage() {
  const supabase = await createClient()
  const [{ data: stages }, { data: members }] = await Promise.all([
    supabase.from('kanban_stages').select('*').order('position'),
    supabase.from('profiles').select('*').order('full_name'),
  ])

  return (
    <>
      <Topbar title="Новый участок" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 p-6">
          <PlotForm stages={stages ?? []} members={members ?? []} />
        </div>
      </main>
    </>
  )
}
