'use client'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { moveToStage, updatePlotPositions, updateStagePositions, createStage } from '@/actions/stages'
import { createClient } from '@/lib/supabase/client'
import { KanbanColumn } from './column'
import { KanbanCard } from './draggable-card'
import { CardDrawer } from './card-drawer'
import { BoardToolbar, emptyFilter, type BoardFilter } from './board-toolbar'
import type { KanbanStage, Plot } from '@/types/plot'

type Member = { id: string; full_name: string | null; avatar_url: string | null }
type LabelDef = { name: string; color: string }

interface BoardProps {
  stages: KanbanStage[]
  initialPlots: Plot[]
  userId: string
  fileCounts: Record<string, number>
  members: Member[]
  labelDefs: LabelDef[]
}

function plotMatches(plot: Plot, filter: BoardFilter): boolean {
  if (filter.zone && plot.zone !== filter.zone) return false
  if (filter.minScore) {
    const min = parseInt(filter.minScore)
    if (Number.isFinite(min) && (plot.score ?? 0) < min) return false
  }
  if (filter.labels.length > 0) {
    const raw = plot.labels
    const names = Array.isArray(raw) ? (raw as { name: string }[]).map(l => l.name) : []
    if (!filter.labels.some(n => names.includes(n))) return false
  }
  return true
}

const kanbanCollision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  if (hits.length > 0) return hits
  return closestCenter(args)
}

export function KanbanBoard({ stages, initialPlots, userId, fileCounts, members, labelDefs }: BoardProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const searchParams = useSearchParams()
  const router = useRouter()

  const [plotsByStage, setPlotsByStage] = useState<Map<string, Plot[]>>(() => buildMap(stages, initialPlots))
  const [stageList, setStageList] = useState<KanbanStage[]>(stages)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<'card' | 'column' | null>(null)
  const [recentlyMoved, setRecentlyMoved] = useState<Set<string>>(new Set())
  const [openPlotId, setOpenPlotId] = useState<string | null>(null)
  const [filter, setFilter] = useState<BoardFilter>(emptyFilter)

  // Open drawer when ?open=<plotId> is in the URL (e.g. from search)
  useEffect(() => {
    const id = searchParams.get('open')
    if (id) {
      setOpenPlotId(id)
      router.replace('/board')
    }
  }, [searchParams, router])
  const [addingStage, setAddingStage] = useState(false)
  const [newStageName, setNewStageName] = useState('')
  const [addingStageLoading, setAddingStageLoading] = useState(false)

  // Click-and-drag horizontal scroll — Trello-style board panning.
  // Activates only when the pointerdown lands on the scroller itself,
  // not on a card or column (those are handled by dnd-kit).
  const scrollerRef = useRef<HTMLDivElement>(null)
  const dragScrollRef = useRef({ active: false, startX: 0, startScroll: 0 })
  const [isDragScrolling, setIsDragScrolling] = useState(false)

  function onScrollerPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    if (e.button !== 0) return
    dragScrollRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: e.currentTarget.scrollLeft,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragScrolling(true)
  }

  function onScrollerPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragScrollRef.current.active || !scrollerRef.current) return
    const dx = dragScrollRef.current.startX - e.clientX
    scrollerRef.current.scrollLeft = dragScrollRef.current.startScroll + dx
  }

  function onScrollerPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragScrollRef.current.active) return
    dragScrollRef.current.active = false
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    setIsDragScrolling(false)
  }

  function handleOptimisticAdd(plot: Plot) {
    setPlotsByStage(prev => addPlotToMap(prev, plot))
  }

  function handleOptimisticReplace(tempId: string, realPlot: Plot) {
    setPlotsByStage(prev => {
      const next = new Map(prev)
      let foundTemp = false

      for (const [stageId, plots] of prev.entries()) {
        const tempIdx = plots.findIndex(p => p.id === tempId)
        if (tempIdx < 0) continue
        foundTemp = true
        // Real plot might have arrived via realtime already — deduplicate
        const withoutTemp = plots.filter(p => p.id !== tempId && p.id !== realPlot.id)
        next.set(stageId, [...withoutTemp, realPlot])
        break
      }

      if (!foundTemp) {
        // Realtime INSERT already replaced the temp; update with latest server data
        return updatePlotInMap(next, realPlot)
      }

      return next
    })
  }

  function handleOptimisticRemove(tempId: string) {
    setPlotsByStage(prev => removePlotFromMap(prev, tempId))
  }

  const activePlot = activeType === 'card' && activeId
    ? [...plotsByStage.values()].flat().find(p => p.id === activeId)
    : null

  const activeStage = activeType === 'column' && activeId
    ? stageList.find(s => s.id === activeId)
    : null

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('kanban-board')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'plots' }, (payload) => {
        const updated = payload.new as Plot
        if (updated.archived) return
        if (recentlyMoved.has(updated.id)) return
        setPlotsByStage(prev => updatePlotInMap(prev, updated))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'plots' }, (payload) => {
        const inserted = payload.new as Plot
        if (inserted.archived || !inserted.stage_id) return
        setPlotsByStage(prev => {
          const stagePlots = prev.get(inserted.stage_id!) ?? []
          // If a temp card with matching address is waiting, replace it
          const tempIdx = stagePlots.findIndex(
            p => p.id.startsWith('temp-') && p.address === inserted.address && p.stage_id === inserted.stage_id
          )
          if (tempIdx >= 0) {
            const next = new Map(prev)
            const copy = [...stagePlots]
            copy[tempIdx] = inserted
            next.set(inserted.stage_id!, copy)
            return next
          }
          // Otherwise add normally (deduplicated)
          return addPlotToMap(prev, inserted)
        })
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[Kanban] Realtime unavailable:', err ?? status)
        }
      })
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  async function handleCreateStage() {
    if (!newStageName.trim()) return
    setAddingStageLoading(true)
    try {
      const created = await createStage(newStageName.trim())
      setStageList(prev => [...prev, created])
      setPlotsByStage(prev => new Map(prev).set(created.id, []))
      setNewStageName('')
      setAddingStage(false)
    } catch { toast.error('Ошибка создания колонки') }
    finally { setAddingStageLoading(false) }
  }

  function onDragStart({ active }: DragStartEvent) {
    const type = active.data.current?.type as 'card' | 'column'
    setActiveId(active.id as string)
    setActiveType(type)
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    setActiveType(null)
    if (!over) return

    const dragType = active.data.current?.type as 'card' | 'column'
    const overType = over.data.current?.type as 'card' | 'column'

    // ── Column reorder ──
    if (dragType === 'column') {
      const fromIdx = stageList.findIndex(s => s.id === active.id)
      const toIdx = stageList.findIndex(s => s.id === over.id)
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return
      const reordered = arrayMove(stageList, fromIdx, toIdx)
      setStageList(reordered)
      try {
        await updateStagePositions(reordered.map((s, i) => ({ id: s.id, position: i })))
      } catch {
        setStageList(stageList)
        toast.error('Не удалось переместить колонку')
      }
      return
    }

    // ── Card drag ──
    const plotId = active.id as string
    const currentStageId = [...plotsByStage.entries()]
      .find(([, plots]) => plots.some(p => p.id === plotId))?.[0]
    if (!currentStageId) return

    let toStageId: string
    let insertIdx: number

    if (overType === 'column') {
      // Dropped on empty column area → append to end
      // over.id may be 'drop-${stageId}' from useDroppable, or stage.id from useSortable
      toStageId = (over.data.current?.stageId as string | undefined) ?? (over.id as string)
      insertIdx = (plotsByStage.get(toStageId) ?? []).length
    } else {
      // Dropped on a card → insert at that card's position
      const overCardId = over.id as string
      const targetEntry = [...plotsByStage.entries()]
        .find(([, plots]) => plots.some(p => p.id === overCardId))
      toStageId = targetEntry?.[0] ?? currentStageId
      insertIdx = (plotsByStage.get(toStageId) ?? []).findIndex(p => p.id === overCardId)
      if (insertIdx === -1) insertIdx = (plotsByStage.get(toStageId) ?? []).length
    }

    if (currentStageId === toStageId) {
      // Same-column reorder
      const columnPlots = plotsByStage.get(currentStageId) ?? []
      const fromIdx = columnPlots.findIndex(p => p.id === plotId)
      if (fromIdx === -1 || fromIdx === insertIdx) return
      const reordered = arrayMove(columnPlots, fromIdx, insertIdx)
      setPlotsByStage(prev => new Map(prev).set(currentStageId, reordered))
      markMoved(plotId)
      try {
        await updatePlotPositions(reordered.map((p, i) => ({ id: p.id, position: i })))
      } catch {
        setPlotsByStage(prev => new Map(prev).set(currentStageId, columnPlots))
        toast.error('Не удалось изменить порядок')
      }
      return
    }

    // Cross-column — insert at position
    const snapshot = new Map(plotsByStage)
    setPlotsByStage(prev => insertPlotAtIndex(prev, plotId, currentStageId, toStageId, insertIdx))
    markMoved(plotId)
    try {
      await moveToStage(plotId, toStageId)
    } catch {
      setPlotsByStage(snapshot)
      toast.error('Не удалось переместить карточку')
    }
  }

  function markMoved(id: string) {
    setRecentlyMoved(s => new Set(s).add(id))
    setTimeout(() => setRecentlyMoved(s => { const n = new Set(s); n.delete(id); return n }), 3000)
  }

  if (!mounted) return (
    <div className="flex flex-col h-full">
      <BoardToolbar
        boardName="Доска"
        members={members}
        labelDefs={labelDefs}
        filter={filter}
        onFilterChange={setFilter}
      />
      <div className="flex gap-2 flex-1 overflow-x-auto pb-4 px-2 pt-2">
        {stageList.map(stage => (
          <div key={stage.id} className="w-[272px] shrink-0 rounded-[12px] bg-[var(--list)] overflow-hidden">
            <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
              <span className="flex-1 text-[14px] font-semibold text-foreground truncate">{stage.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <BoardToolbar
        boardName="Доска"
        members={members}
        labelDefs={labelDefs}
        filter={filter}
        onFilterChange={setFilter}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={kanbanCollision}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={stageList.map(s => s.id)} strategy={horizontalListSortingStrategy}>
          <div
            ref={scrollerRef}
            onPointerDown={onScrollerPointerDown}
            onPointerMove={onScrollerPointerMove}
            onPointerUp={onScrollerPointerUp}
            onPointerCancel={onScrollerPointerUp}
            className={cn(
              'flex gap-2 flex-1 overflow-x-auto pb-4 px-2 pt-2 items-start select-none',
              isDragScrolling && 'cursor-grabbing'
            )}
          >
            {stageList.map(stage => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                plots={(plotsByStage.get(stage.id) ?? []).filter(p => plotMatches(p, filter))}
                onOpenCard={setOpenPlotId}
                activeType={activeType}
                fileCounts={fileCounts}
                onOptimisticAdd={handleOptimisticAdd}
                onOptimisticReplace={handleOptimisticReplace}
                onOptimisticRemove={handleOptimisticRemove}
              />
            ))}

            {/* Add column — Trello-style translucent tile */}
            <div className="shrink-0 w-[272px]">
              {addingStage ? (
                <div className="rounded-xl p-2 space-y-2 bg-[var(--list)] ring-1 ring-black/30">
                  <input
                    autoFocus
                    value={newStageName}
                    onChange={e => setNewStageName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateStage(); if (e.key === 'Escape') setAddingStage(false) }}
                    placeholder="Название колонки..."
                    className="w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateStage}
                      disabled={addingStageLoading}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium py-1.5 rounded-md transition-colors disabled:opacity-50"
                    >
                      {addingStageLoading ? '…' : 'Добавить'}
                    </button>
                    <button
                      onClick={() => { setAddingStage(false); setNewStageName('') }}
                      className="px-3 text-muted-foreground hover:text-foreground text-xs rounded-md hover:bg-white/[0.06] transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingStage(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Добавить колонку
                </button>
              )}
            </div>
          </div>
        </SortableContext>

        <DragOverlay>
          {activePlot && <KanbanCard plot={activePlot} isDragging fileCounts={fileCounts} />}
          {activeStage && (
            <div className="w-[272px] rounded-[12px] opacity-95 shadow-2xl bg-[var(--list)]">
              <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
                <span className="text-[14px] font-semibold text-foreground truncate">{activeStage.name}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {openPlotId && (
        <CardDrawer
          plotId={openPlotId}
          stages={stageList}
          userId={userId}
          onClose={() => setOpenPlotId(null)}
          onPlotUpdate={(updated) => setPlotsByStage(prev => updatePlotInMap(prev, updated))}
          onPlotRemove={(id) => setPlotsByStage(prev => removePlotFromMap(prev, id))}
        />
      )}
    </div>
  )
}

function buildMap(stages: KanbanStage[], plots: Plot[]): Map<string, Plot[]> {
  const map = new Map<string, Plot[]>()
  stages.forEach(s => map.set(s.id, []))
  const sorted = [...plots].sort((a, b) => ((a as any).position ?? 0) - ((b as any).position ?? 0))
  sorted.forEach(p => {
    if (p.stage_id && map.has(p.stage_id)) map.get(p.stage_id)!.push(p)
  })
  return map
}

function updatePlotInMap(prev: Map<string, Plot[]>, updated: Plot): Map<string, Plot[]> {
  const next = new Map(prev)
  let replacedInPlace = false
  for (const [id, plots] of prev.entries()) {
    const idx = plots.findIndex(p => p.id === updated.id)
    if (idx === -1) continue
    if (id === updated.stage_id) {
      // Same column — replace in-place so card doesn't jump to bottom
      const copy = [...plots]
      copy[idx] = updated
      next.set(id, copy)
      replacedInPlace = true
    } else {
      // Card moved to different column via realtime — remove from old
      next.set(id, plots.filter(p => p.id !== updated.id))
    }
  }
  // If not replaced in-place (cross-column move or brand new card), append to target column
  if (!replacedInPlace && updated.stage_id && next.has(updated.stage_id)) {
    next.get(updated.stage_id)!.push(updated)
  }
  return next
}

function addPlotToMap(prev: Map<string, Plot[]>, plot: Plot): Map<string, Plot[]> {
  if (!plot.stage_id) return prev
  const next = new Map(prev)
  if (next.has(plot.stage_id)) {
    const existing = next.get(plot.stage_id)!
    if (!existing.some(p => p.id === plot.id)) {
      next.set(plot.stage_id, [...existing, plot])
    }
  }
  return next
}

function removePlotFromMap(prev: Map<string, Plot[]>, plotId: string): Map<string, Plot[]> {
  const next = new Map(prev)
  for (const [id, plots] of next.entries()) next.set(id, plots.filter(p => p.id !== plotId))
  return next
}

function insertPlotAtIndex(
  prev: Map<string, Plot[]>,
  plotId: string,
  fromStageId: string,
  toStageId: string,
  insertIdx: number
): Map<string, Plot[]> {
  const next = new Map(prev)
  const movingPlot = (prev.get(fromStageId) ?? []).find(p => p.id === plotId)
  if (!movingPlot) return prev
  next.set(fromStageId, (prev.get(fromStageId) ?? []).filter(p => p.id !== plotId))
  const toList = [...(next.get(toStageId) ?? [])]
  toList.splice(insertIdx, 0, { ...movingPlot, stage_id: toStageId })
  next.set(toStageId, toList)
  return next
}
