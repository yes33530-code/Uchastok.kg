import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { KanbanBoard } from '@/components/kanban/board'

export const metadata = { title: 'Доска — Uchastok.kg' }

export default async function BoardPage() {
  const supabase = await createClient()

  const [{ data: { user } }, { data: stages }, { data: rawPlots }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('kanban_stages').select('*').order('position'),
    supabase.from('plots').select('*, plot_files(count)').eq('archived', false).order('position'),
  ])

  const fileCounts: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyPlots = rawPlots as any[]
  anyPlots?.forEach((p: any) => {
    fileCounts[p.id] = p.plot_files?.[0]?.count ?? 0
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plots = anyPlots?.map(({ plot_files: _pf, ...rest }: any) => rest) ?? []

  return (
    <>
      <Topbar title="Доска" />
      <main className="flex-1 overflow-hidden p-3 md:p-6">
        <Suspense>
          <KanbanBoard stages={stages ?? []} initialPlots={plots} userId={user?.id ?? ''} fileCounts={fileCounts} />
        </Suspense>
      </main>
    </>
  )
}
