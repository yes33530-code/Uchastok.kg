import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/kanban/board'

export const metadata = { title: 'Доска — Uchastok.kg' }

export default async function BoardPage() {
  const supabase = await createClient()

  const [{ data: { user } }, { data: stages }, { data: rawPlots }, { data: members }, { data: labelDefs }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('kanban_stages').select('*').order('position'),
    supabase.from('plots').select('*, plot_files(count)').eq('archived', false).order('position'),
    supabase.from('profiles').select('id, full_name, avatar_url').eq('approved', true).order('created_at'),
    supabase.from('label_definitions').select('name, color').order('created_at'),
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
    <main className="flex-1 overflow-hidden flex flex-col">
      <Suspense>
        <KanbanBoard
          stages={stages ?? []}
          initialPlots={plots}
          userId={user?.id ?? ''}
          fileCounts={fileCounts}
          members={members ?? []}
          labelDefs={labelDefs ?? []}
        />
      </Suspense>
    </main>
  )
}
