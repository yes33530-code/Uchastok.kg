import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export const metadata = { title: 'Дашборд — Uchastok.kg' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: plots }, { data: stages }] = await Promise.all([
    supabase.from('plots').select('*').eq('archived', false).order('created_at', { ascending: false }),
    supabase.from('kanban_stages').select('*').order('position'),
  ])

  return (
    <>
      <main className="flex-1 overflow-y-auto p-3 md:p-6">
        <Suspense>
          <DashboardClient initialPlots={plots ?? []} stages={stages ?? []} />
        </Suspense>
      </main>
    </>
  )
}
