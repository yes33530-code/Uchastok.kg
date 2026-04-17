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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/80">Автоматизации</h3>
        <button
          onClick={() => setCreating(c => !c)}
          className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Новая
        </button>
      </div>

      {creating && (
        <form onSubmit={submit} className="rounded-xl p-4 mb-5 space-y-4" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h4 className="text-sm font-medium text-white/70">Новое правило</h4>
          <input
            placeholder="Название правила"
            value={form.name}
            onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
            className={inputCls}
          />
          <div>
            <label className="block text-xs text-white/40 mb-1">Когда участок переходит в стадию</label>
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
            <label className="block text-xs text-white/40">Пункты чек-листа</label>
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
                <label className="flex items-center gap-1 text-xs text-white/40 shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.required}
                    onChange={e => setForm(s => {
                      const items = [...s.items]
                      items[i] = { ...items[i], required: e.target.checked }
                      return { ...s, items }
                    })}
                    className="w-3 h-3 accent-indigo-500"
                  />
                  Обязательно
                </label>
                {form.items.length > 1 && (
                  <button type="button" onClick={() => setForm(s => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }))}>
                    <Trash2 className="w-4 h-4 text-white/30 hover:text-red-400 transition-colors" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm(s => ({ ...s, items: [...s.items, { label: '', required: false }] }))}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              + Добавить пункт
            </button>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">
              Создать
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {rules.length === 0 && !creating && (
          <p className="text-sm text-white/30 text-center py-6">Нет автоматизаций. Создайте первую!</p>
        )}
        {rules.map(rule => {
          const stage = stages.find(s => s.id === rule.trigger_stage_id)
          return (
            <div key={rule.id} className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-white/3" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <p className="text-sm font-medium text-white/80">{rule.name}</p>
                <p className="text-xs text-white/40">→ {stage?.name ?? 'Стадия удалена'}</p>
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
                      : 'bg-white/8 text-white/40'
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
                  className="text-white/20 hover:text-red-400 transition-colors"
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

const inputCls = 'w-full rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:ring-1 focus:ring-indigo-500/60 bg-black/40 placeholder-white/25 focus:border-indigo-500/50 [&>option]:bg-[#112545]'
  + ' ' + 'border border-white/8'
