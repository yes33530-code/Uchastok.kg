'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Star, CalendarDays, LayoutGrid, type LucideIcon } from 'lucide-react'
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
    { name: '0–30', color: '#F87168', count: plots.filter(p => (p.score ?? 0) <= 30).length },
    { name: '31–55', color: '#F5A25D', count: plots.filter(p => (p.score ?? 0) > 30 && (p.score ?? 0) <= 55).length },
    { name: '56–70', color: '#E9C75A', count: plots.filter(p => (p.score ?? 0) > 55 && (p.score ?? 0) <= 70).length },
    { name: '71–85', color: '#4BCE97', count: plots.filter(p => (p.score ?? 0) > 70 && (p.score ?? 0) <= 85).length },
    { name: '86–100', color: '#22A06B', count: plots.filter(p => (p.score ?? 0) > 85).length },
  ]

  const recentPlots = plots.slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Title */}
      <div>
        <h2 className="text-[18px] font-semibold text-foreground leading-tight">Дашборд</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">Сводка по активным участкам.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Активных участков" value={totalPlots.toString()} icon={MapPin} tint="#579DFF" />
        <StatCard label="Средняя оценка" value={avgScore.toString()} sub="/100" icon={Star} tint="#E9C75A" />
        <StatCard label="Добавлено в месяц" value={plotsThisMonth.toString()} icon={CalendarDays} tint="#9F8FEF" />
        <StatCard label="На доске" value={plots.filter(p => p.stage_id).length.toString()} icon={LayoutGrid} tint="#4BCE97" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Panel title="По стадиям">
          <StageChart data={stageData} />
        </Panel>
        <Panel title="Распределение оценок">
          <ScoreDistributionChart data={scoreBuckets} />
        </Panel>
      </div>

      {/* Recent plots */}
      <Panel
        title="Последние участки"
        action={<Link href="/plots" className="text-[12px] text-primary hover:text-primary/80 font-medium">Все участки →</Link>}
      >
        {recentPlots.length === 0 ? (
          <p className="text-[13px] text-muted-foreground text-center py-6">Нет участков</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {recentPlots.map(plot => {
              const stageInfo = stages.find(s => s.id === plot.stage_id)
              return (
                <li key={plot.id}>
                  <Link
                    href={`/plots/${plot.id}`}
                    className="group flex items-center gap-3 py-2.5 -mx-1 px-1 rounded-md hover:bg-[var(--list)]/60 transition-colors"
                  >
                    <ScoreBadge score={plot.score} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {plot.address}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
                        <span className="tabular-nums">{formatSotok(plot.size_sotok)}</span>
                        <span className="text-border">•</span>
                        <span className="tabular-nums">{formatDate(plot.created_at)}</span>
                      </div>
                    </div>
                    {stageInfo ? (
                      <span
                        className="inline-flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-md text-[11px] font-medium"
                        style={{
                          backgroundColor: `${stageInfo.color}22`,
                          color: stageInfo.color,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stageInfo.color }} />
                        {stageInfo.name}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[11px] text-muted-foreground/60">—</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card ring-1 ring-white/[0.08] shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tint,
}: {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  tint: string
}) {
  return (
    <div className="bg-card ring-1 ring-white/[0.08] shadow rounded-md p-3.5">
      <div className="flex items-start gap-3">
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${tint}22`, color: tint }}
        >
          <Icon size={16} strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold truncate">
            {label}
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[22px] font-bold text-foreground tabular-nums leading-none">{value}</span>
            {sub && <span className="text-[13px] text-muted-foreground">{sub}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
