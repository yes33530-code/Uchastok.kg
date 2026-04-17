'use client'
import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Plus, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { createPlot } from '@/actions/plots'
import { renameStage } from '@/actions/stages'
import { KanbanCard } from './draggable-card'
import type { KanbanStage, Plot } from '@/types/plot'

interface Props {
  stage: KanbanStage
  plots: Plot[]
  onOpenCard: (plotId: string) => void
  activeType: 'card' | 'column' | null
  fileCounts: Record<string, number>
  onOptimisticAdd: (plot: Plot) => void
  onOptimisticReplace: (tempId: string, realPlot: Plot) => void
  onOptimisticRemove: (tempId: string) => void
}

export function KanbanColumn({ stage, plots, onOpenCard, activeType, fileCounts, onOptimisticAdd, onOptimisticReplace, onOptimisticRemove }: Props) {
  // Sortable for column reordering — drag handle on header
  const {
    setNodeRef: setColumnRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging: isColumnDragging,
  } = useSortable({ id: stage.id, data: { type: 'column' } })

  // Separate droppable for the cards body — avoids conflicting with column sortable
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `drop-${stage.id}`, data: { type: 'column', stageId: stage.id } })

  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(stage.name)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingName) nameRef.current?.select()
  }, [editingName])

  async function commitRename() {
    setEditingName(false)
    const trimmed = nameValue.trim()
    if (!trimmed || trimmed === stage.name) { setNameValue(stage.name); return }
    try {
      await renameStage(stage.id, trimmed)
    } catch {
      toast.error('Ошибка переименования')
      setNameValue(stage.name)
    }
  }

  async function handleAdd() {
    const address = input.trim()
    if (!address) return

    // Clear input and show card instantly
    setInput('')
    inputRef.current?.focus()

    const tempId = `temp-${Date.now()}`
    const now = new Date().toISOString()
    onOptimisticAdd({
      id: tempId,
      address,
      stage_id: stage.id,
      size_sotok: 0,
      price_usd_per_100sqm: null,
      owner_share_pct: 0,
      contact_name: null,
      contact_phone: null,
      contact_email: null,
      project_duration_months: null,
      legal_clearance: false,
      zone: null,
      assigned_to: null,
      notes: null,
      score: null,
      score_breakdown: null,
      location_details: null,
      infra_electricity: null,
      infra_water: null,
      infra_gas: null,
      infra_sewer: null,
      archived: false,
      archived_at: null,
      archived_by: null,
      published: false,
      created_by: null,
      created_at: now,
      updated_at: now,
      position: 0,
      labels: [],
    })

    try {
      const realPlot = await createPlot({
        address,
        size_sotok: 0,
        owner_share_pct: 0,
        legal_clearance: false,
        stage_id: stage.id,
        price_usd_per_100sqm: null,
        contact_name: null,
        contact_phone: null,
        contact_email: null,
        project_duration_months: null,
        zone: null,
        assigned_to: null,
        notes: null,
      })
      onOptimisticReplace(tempId, realPlot)
    } catch (err) {
      onOptimisticRemove(tempId)
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const showDropHighlight = isOver && activeType === 'card'

  const columnStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isColumnDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setColumnRef}
      style={columnStyle}
      className="flex flex-col w-64 shrink-0 rounded-xl"
    >
      {/* Header — drag handle for column */}
      <div
        className="flex items-center gap-1.5 px-2 py-2.5 rounded-t-xl cursor-grab active:cursor-grabbing"
        style={{ borderTop: `3px solid ${stage.color}`, backgroundColor: 'rgba(0,0,0,0.5)' }}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5 text-white/20 shrink-0" />
        {editingName ? (
          <input
            ref={nameRef}
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') { setNameValue(stage.name); setEditingName(false) }
            }}
            // Stop drag listeners from firing while editing text
            onPointerDown={e => e.stopPropagation()}
            className="flex-1 text-sm font-semibold text-white bg-transparent outline-none border-b border-white/30 min-w-0"
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold text-white/90 truncate hover:text-white transition-colors"
            onDoubleClick={e => { e.stopPropagation(); setEditingName(true) }}
            title="Двойной клик для переименования"
          >
            {nameValue}
          </span>
        )}
        <span
          className="text-xs font-medium rounded-full px-1.5 py-0.5 text-white shrink-0"
          style={{ backgroundColor: stage.color }}
        >
          {plots.length}
        </span>
      </div>

      {/* Cards body — separate droppable */}
      <div
        ref={setDropRef}
        className="flex-1 px-1.5 pt-1.5 pb-1.5 space-y-1.5 min-h-[3rem] rounded-b-xl transition-colors"
        style={{
          backgroundColor: showDropHighlight ? `${stage.color}12` : '#0f1a2e',
          borderLeft: `1px solid ${showDropHighlight ? stage.color + '40' : 'rgba(255,255,255,0.07)'}`,
          borderRight: `1px solid ${showDropHighlight ? stage.color + '40' : 'rgba(255,255,255,0.07)'}`,
          borderBottom: `1px solid ${showDropHighlight ? stage.color + '40' : 'rgba(255,255,255,0.07)'}`,
          borderTop: 'none',
        }}
      >
        <SortableContext items={plots.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {plots.map(plot => (
            <KanbanCard
              key={plot.id}
              plot={plot}
              onOpen={() => onOpenCard(plot.id)}
              fileCounts={fileCounts}
            />
          ))}
        </SortableContext>

        {plots.length === 0 && showDropHighlight && (
          <div className="h-14 rounded-lg border-2 border-dashed opacity-30" style={{ borderColor: stage.color }} />
        )}

        {/* Inline add */}
        <div
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-transparent focus-within:border-white/15 transition-colors"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        >
          <Plus className="w-3.5 h-3.5 text-white/20 shrink-0" />
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Добавить карточку..."
            className="flex-1 bg-transparent text-xs text-white/60 placeholder-white/20 outline-none"
          />
        </div>
      </div>
    </div>
  )
}
