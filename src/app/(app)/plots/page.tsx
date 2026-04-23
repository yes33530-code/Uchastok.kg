import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PlotsTable } from '@/components/plots/plots-table'

export const metadata = { title: 'Участки — Uchastok.kg' }

export default async function PlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>
}) {
  const params = await searchParams
  const showArchived = params.archived === '1'

  const supabase = await createClient()
  const [{ data: stages }, { data: plots }] = await Promise.all([
    supabase.from('kanban_stages').select('*').order('position'),
    supabase.from('plots').select('*').eq('archived', showArchived).not('stage_id', 'is', null).order('created_at', { ascending: false }),
  ])

  return (
    <>
      <main className="flex-1 overflow-y-auto p-3 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-1 bg-card rounded-lg p-1">
            <Link
              href="/plots"
              className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${!showArchived ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              Активные
            </Link>
            <Link
              href="/plots?archived=1"
              className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${showArchived ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              Архив
            </Link>
          </div>
          <Link
            href="/plots/new"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Добавить участок
          </Link>
        </div>

        <Suspense>
          <PlotsTable
            initialPlots={plots ?? []}
            stages={stages ?? []}
            showArchived={showArchived}
          />
        </Suspense>
      </main>
    </>
  )
}
