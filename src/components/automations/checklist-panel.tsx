'use client'
import { useState } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { updateChecklistItem } from '@/actions/automations'
import type { PlotChecklist, ChecklistItem } from '@/types/plot'

interface Props {
  checklists: PlotChecklist[]
  userId: string
}

export function ChecklistPanel({ checklists, userId }: Props) {
  return (
    <div className="bg-[var(--list)]/60 rounded-md border border-border p-4">
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Чек-листы</h3>
      <div className="space-y-3">
        {checklists.map(checklist => (
          <SingleChecklist key={checklist.id} checklist={checklist} userId={userId} />
        ))}
      </div>
    </div>
  )
}

function SingleChecklist({ checklist, userId }: { checklist: PlotChecklist; userId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>(
    (checklist.items as unknown as ChecklistItem[]) ?? []
  )
  const [open, setOpen] = useState(true)
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)

  const completedCount = items.filter(i => i.checked).length

  async function toggle(index: number) {
    const newChecked = !items[index].checked
    setLoadingIndex(index)
    try {
      await updateChecklistItem(checklist.id, index, newChecked)
      setItems(prev => prev.map((item, i) =>
        i !== index ? item : {
          ...item,
          checked: newChecked,
          checked_by: newChecked ? userId : null,
          checked_at: newChecked ? new Date().toISOString() : null,
        }
      ))
    } catch {
      toast.error('Ошибка')
    } finally {
      setLoadingIndex(null)
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">{checklist.title}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{completedCount}/{items.length}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 py-3 space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <button
                onClick={() => toggle(index)}
                disabled={loadingIndex === index}
                className="shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
              >
                {item.checked
                  ? <CheckCircle2 className="w-5 h-5 text-primary" />
                  : <Circle className={`w-5 h-5 ${item.required ? 'text-destructive/60' : 'text-border'}`} />
                }
              </button>
              <span className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground/90'}`}>
                {item.label}
                {item.required && !item.checked && (
                  <span className="ml-1 text-xs text-destructive">*</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
