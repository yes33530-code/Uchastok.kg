'use client'
import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Plus, MoreHorizontal } from 'lucide-react'
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
      className="group/col flex flex-col w-[272px] shrink-0 rounded-[12px] bg-[var(--list)] overflow-hidden max-h-full"
    >
      {/* Header — bare title + menu affordance */}
      <div
        className="flex items-center gap-2 px-3 pt-2.5 pb-2 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
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
            onPointerDown={e => e.stopPropagation()}
            className="flex-1 text-[14px] font-semibold text-foreground bg-transparent outline-none border-b border-border min-w-0"
          />
        ) : (
          <span
            className="flex-1 text-[14px] font-semibold text-foreground truncate"
            onDoubleClick={e => { e.stopPropagation(); setEditingName(true) }}
            title="Двойной клик для переименования"
          >
            {nameValue}
          </span>
        )}
        <button
          type="button"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation() }}
          className="shrink-0 p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.06] transition-colors"
          aria-label="Меню списка"
          title={`${plots.length} карточек`}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Cards body — separate droppable */}
      <div
        ref={setDropRef}
        className="flex-1 min-h-[3rem] overflow-y-auto px-2 pb-1.5 space-y-2 transition-colors"
        style={
          showDropHighlight
            ? { backgroundColor: `${stage.color}14`, boxShadow: `inset 0 0 0 1px ${stage.color}40` }
            : undefined
        }
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
          <div className="h-14 rounded-md border-2 border-dashed opacity-40" style={{ borderColor: stage.color }} />
        )}
      </div>

      {/* Inline add — sticky footer, Trello-style "+ Add a card" */}
      <button
        type="button"
        onClick={() => inputRef.current?.focus()}
        className="group/add mx-2 mb-2 mt-0 flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[13px] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
      >
        <Plus className="w-3.5 h-3.5 shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Добавить карточку…"
          className="flex-1 bg-transparent text-[13px] placeholder:text-muted-foreground outline-none group-hover/add:placeholder:text-foreground"
        />
      </button>
    </div>
  )
}
