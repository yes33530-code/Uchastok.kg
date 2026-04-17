import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
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
      <Topbar title="Архив" />
      <main className="flex-1 overflow-y-auto p-3 md:p-6">
        <p className="text-sm text-white/40 mb-5">
          Архивные участки не отображаются на доске и в списке, но доступны через поиск.
        </p>

        <div className="rounded-xl overflow-hidden overflow-x-auto" style={{ backgroundColor: '#142a50', border: '1px solid rgba(255,255,255,0.08)' }}>
          <table className="w-full text-sm min-w-[520px]">
            <thead style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <tr>
                <th className="text-left px-4 py-3 font-medium text-white/40 text-xs uppercase tracking-wide">Адрес</th>
                <th className="text-left px-4 py-3 font-medium text-white/40 text-xs uppercase tracking-wide">Площадь</th>
                <th className="text-left px-4 py-3 font-medium text-white/40 text-xs uppercase tracking-wide">Оценка</th>
                <th className="text-left px-4 py-3 font-medium text-white/40 text-xs uppercase tracking-wide">Архивирован</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(plots ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-white/30">
                    Архив пуст
                  </td>
                </tr>
              )}
              {(plots ?? []).map(plot => (
                <tr key={plot.id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/plots/${plot.id}`} className="font-medium text-white/80 hover:text-indigo-400 transition-colors">
                      {plot.address}
                    </Link>
                    <span className="ml-2 text-xs bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full">Архив</span>
                  </td>
                  <td className="px-4 py-3 text-white/50">{formatSotok(plot.size_sotok)}</td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={plot.score} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-white/30">{formatDate(plot.archived_at)}</td>
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
