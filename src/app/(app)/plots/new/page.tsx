import { createClient } from '@/lib/supabase/server'
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
      <main className="flex-1 overflow-y-auto p-3 md:p-6">
        <div className="max-w-3xl mx-auto bg-card ring-1 ring-white/[0.08] shadow-2xl rounded-lg p-5 md:p-6">
          <PlotForm stages={stages ?? []} members={members ?? []} />
        </div>
      </main>
    </>
  )
}
