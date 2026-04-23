'use client'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createAutomationRule, toggleAutomationRule, deleteAutomationRule } from '@/actions/automations'
import type { KanbanStage, AutomationRule } from '@/types/plot'

interface Props {
  stages: KanbanStage[]
  rules: (AutomationRule & { checklist_templates: { title: string; items: unknown }[] })[]
}

export function AutomationManager({ stages, rules: initialRules }: Props) {
  const [rules, setRules] = useState(initialRules)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    trigger_stage_id: '',
    checklist_title: '',
    items: [{ label: '', required: false }],
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const validItems = form.items.filter(i => i.label.trim())
    if (!form.name || !form.trigger_stage_id || !form.checklist_title || validItems.length === 0) {
      toast.error('Заполните все поля')
      return
    }
    try {
      await createAutomationRule({
        name: form.name,
        trigger_stage_id: form.trigger_stage_id,
        checklist_title: form.checklist_title,
        checklist_items: validItems,
      })
      toast.success('Автоматизация создана')
      setCreating(false)
      setForm({ name: '', trigger_stage_id: '', checklist_title: '', items: [{ label: '', required: false }] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={() => setCreating(c => !c)}
          className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Новая
        </button>
      </div>

      {creating && (
        <form onSubmit={submit} className="rounded-xl p-4 mb-5 space-y-4 bg-muted/60 border border-border">
          <h4 className="text-sm font-medium text-foreground/80">Новое правило</h4>
          <input
            placeholder="Название правила"
            value={form.name}
            onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
            className={inputCls}
          />
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Когда участок переходит в стадию</label>
            <select
              value={form.trigger_stage_id}
              onChange={e => setForm(s => ({ ...s, trigger_stage_id: e.target.value }))}
              className={inputCls}
            >
              <option value="">— Выбрать —</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <input
            placeholder="Название чек-листа"
            value={form.checklist_title}
            onChange={e => setForm(s => ({ ...s, checklist_title: e.target.value }))}
            className={inputCls}
          />
          <div className="space-y-2">
            <label className="block text-xs text-muted-foreground">Пункты чек-листа</label>
            {form.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  placeholder={`Пункт ${i + 1}`}
                  value={item.label}
                  onChange={e => setForm(s => {
                    const items = [...s.items]
                    items[i] = { ...items[i], label: e.target.value }
                    return { ...s, items }
                  })}
                  className={`${inputCls} flex-1`}
                />
                <label className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.required}
                    onChange={e => setForm(s => {
                      const items = [...s.items]
                      items[i] = { ...items[i], required: e.target.checked }
                      return { ...s, items }
                    })}
                    className="w-3 h-3 accent-primary"
                  />
                  Обязательно
                </label>
                {form.items.length > 1 && (
                  <button type="button" onClick={() => setForm(s => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }))}>
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm(s => ({ ...s, items: [...s.items, { label: '', required: false }] }))}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              + Добавить пункт
            </button>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Создать
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors border border-border"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {rules.length === 0 && !creating && (
          <p className="text-sm text-muted-foreground text-center py-6">Нет автоматизаций. Создайте первую!</p>
        )}
        {rules.map(rule => {
          const stage = stages.find(s => s.id === rule.trigger_stage_id)
          return (
            <div key={rule.id} className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-muted/40 border border-border/60">
              <div>
                <p className="text-sm font-medium text-foreground">{rule.name}</p>
                <p className="text-xs text-muted-foreground">→ {stage?.name ?? 'Стадия удалена'}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    await toggleAutomationRule(rule.id, !rule.enabled)
                    setRules(r => r.map(x => x.id === rule.id ? { ...x, enabled: !x.enabled } : x))
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    rule.enabled
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {rule.enabled ? 'Активно' : 'Выкл'}
                </button>
                <button
                  onClick={async () => {
                    await deleteAutomationRule(rule.id)
                    setRules(r => r.filter(x => x.id !== rule.id))
                    toast.success('Удалено')
                  }}
                  className="text-muted-foreground/60 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const inputCls = 'w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40 bg-muted/60 placeholder:text-muted-foreground/60 focus:border-ring [&>option]:bg-popover [&>option]:text-foreground'
  + ' ' + 'border border-border'
