import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ScoreBadge } from '@/components/ui/score-badge'
import { formatSotok, formatDate } from '@/lib/utils'
import { ArchiveButton } from '@/components/plots/archive-button'

export const metadata = { title: 'Архив — Uchastok.kg' }

export default async function ArchivePage() {
  const supabase = await createClient()
  const { data: plots } = await supabase
    .from('plots')
    .select('*')
    .eq('archived', true)
    .order('archived_at', { ascending: false })

  return (
    <>
      <main className="flex-1 overflow-y-auto p-3 md:p-6">
        <p className="text-sm text-muted-foreground mb-5">
          Архивные участки не отображаются на доске и в списке, но доступны через поиск.
        </p>

        <div className="rounded-xl overflow-hidden overflow-x-auto bg-card border border-border">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Адрес</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Площадь</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Оценка</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Архивирован</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(plots ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    Архив пуст
                  </td>
                </tr>
              )}
              {(plots ?? []).map(plot => (
                <tr key={plot.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/plots/${plot.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                      {plot.address}
                    </Link>
                    <span className="ml-2 text-xs bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded-full">Архив</span>
                  </td>
                  <td className="px-4 py-3 text-foreground/80 tabular-nums">{formatSotok(plot.size_sotok)}</td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={plot.score} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{formatDate(plot.archived_at)}</td>
                  <td className="px-4 py-3">
                    <ArchiveButton plotId={plot.id} archived={true} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
