'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ScoreBadge } from '@/components/ui/score-badge'
import { StageChart } from '@/components/dashboard/stage-chart'
import { ScoreDistributionChart } from '@/components/dashboard/score-distribution'
import { formatSotok, formatDate } from '@/lib/utils'
import type { Plot, KanbanStage } from '@/types/plot'

interface Props {
  initialPlots: Plot[]
  stages: KanbanStage[]
}

export function DashboardClient({ initialPlots, stages }: Props) {
  const [plots, setPlots] = useState<Plot[]>(initialPlots)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plots' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const p = payload.new as Plot
          if (!p.archived) setPlots(prev => [p, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          const p = payload.new as Plot
          if (!p.archived) {
            setPlots(prev => {
              const idx = prev.findIndex(x => x.id === p.id)
              if (idx >= 0) { const copy = [...prev]; copy[idx] = p; return copy }
              return [p, ...prev]
            })
          } else {
            setPlots(prev => prev.filter(x => x.id !== p.id))
          }
        } else if (payload.eventType === 'DELETE') {
          setPlots(prev => prev.filter(x => x.id !== (payload.old as Plot).id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const totalPlots = plots.length
  const avgScore = totalPlots > 0
    ? Math.round(plots.reduce((s, p) => s + (p.score ?? 0), 0) / totalPlots)
    : 0
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const plotsThisMonth = plots.filter(p => p.created_at >= startOfMonth).length

  const stageData = stages.map(stage => ({
    name: stage.name,
    color: stage.color,
    count: plots.filter(p => p.stage_id === stage.id).length,
  }))

  const scoreBuckets = [
    { name: '0–30', color: '#ef4444', count: plots.filter(p => (p.score ?? 0) <= 30).length },
    { name: '31–55', color: '#f97316', count: plots.filter(p => (p.score ?? 0) > 30 && (p.score ?? 0) <= 55).length },
    { name: '56–70', color: '#eab308', count: plots.filter(p => (p.score ?? 0) > 55 && (p.score ?? 0) <= 70).length },
    { name: '71–85', color: '#22c55e', count: plots.filter(p => (p.score ?? 0) > 70 && (p.score ?? 0) <= 85).length },
    { name: '86–100', color: '#10b981', count: plots.filter(p => (p.score ?? 0) > 85).length },
  ]

  const recentPlots = plots.slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Активных участков" value={totalPlots.toString()} />
        <StatCard label="Средняя оценка" value={avgScore.toString()} sub="/100" />
        <StatCard label="Добавлено в месяц" value={plotsThisMonth.toString()} />
        <StatCard label="На доске" value={plots.filter(p => p.stage_id).length.toString()} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-[#142a50] border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white/80 mb-4">По стадиям</h3>
          <StageChart data={stageData} />
        </div>
        <div className="bg-[#142a50] border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white/80 mb-4">Распределение оценок</h3>
          <ScoreDistributionChart data={scoreBuckets} />
        </div>
      </div>

      {/* Recent plots */}
      <div className="bg-[#142a50] border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/80">Последние участки</h3>
          <Link href="/plots" className="text-xs text-indigo-400 hover:text-indigo-300">Все участки →</Link>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr>
              <th className="text-left py-2 font-medium text-white/30 text-xs uppercase tracking-wide">Адрес</th>
              <th className="text-left py-2 font-medium text-white/30 text-xs uppercase tracking-wide">Площадь</th>
              <th className="text-left py-2 font-medium text-white/30 text-xs uppercase tracking-wide">Стадия</th>
              <th className="text-left py-2 font-medium text-white/30 text-xs uppercase tracking-wide">Оценка</th>
              <th className="text-left py-2 font-medium text-white/30 text-xs uppercase tracking-wide">Добавлен</th>
            </tr>
          </thead>
          <tbody>
            {recentPlots.map(plot => {
              const stageInfo = stages.find(s => s.id === plot.stage_id)
              return (
                <tr key={plot.id} className="border-t border-white/5">
                  <td className="py-2.5">
                    <Link href={`/plots/${plot.id}`} className="font-medium text-white/80 hover:text-indigo-400 transition-colors">
                      {plot.address}
                    </Link>
                  </td>
                  <td className="py-2.5 text-white/40">{formatSotok(plot.size_sotok)}</td>
                  <td className="py-2.5">
                    {stageInfo ? (
                      <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: stageInfo.color }}>
                        {stageInfo.name}
                      </span>
                    ) : <span className="text-white/20">—</span>}
                  </td>
                  <td className="py-2.5"><ScoreBadge score={plot.score} size="sm" /></td>
                  <td className="py-2.5 text-white/30">{formatDate(plot.created_at)}</td>
                </tr>
              )
            })}
            {recentPlots.length === 0 && (
              <tr><td colSpan={5} className="text-center py-6 text-white/30">Нет участков</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#142a50] border border-white/10 rounded-xl p-5">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        {sub && <span className="text-sm text-white/30">{sub}</span>}
      </div>
    </div>
  )
}
