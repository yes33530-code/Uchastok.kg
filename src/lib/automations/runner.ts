'use server'
import { createClient } from '@/lib/supabase/server'
import type { ChecklistItem } from '@/types/plot'
import type { Json } from '@/types/database.types'

/**
 * Runs all enabled automation rules for a stage change.
 * Idempotent: checks for existing checklist before inserting.
 */
export async function runAutomations(plotId: string, toStageId: string, _changedBy: string) {
  const supabase = await createClient()

  // Find matching enabled rules
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('id, name')
    .eq('trigger_stage_id', toStageId)
    .eq('enabled', true)

  if (!rules || rules.length === 0) return

  for (const rule of rules) {
    // Fetch templates for this rule
    const { data: templates } = await supabase
      .from('checklist_templates')
      .select('id, title, items')
      .eq('rule_id', rule.id)

    if (!templates || templates.length === 0) continue

    for (const template of templates) {
      // Idempotency: skip if checklist already exists for this rule+stage
      const { data: existing } = await supabase
        .from('plot_checklists')
        .select('id')
        .eq('plot_id', plotId)
        .eq('rule_id', rule.id)
        .eq('stage_id', toStageId)
        .maybeSingle()

      if (existing) continue

      const rawItems = (template.items as unknown as { label: string; required?: boolean }[] | null) ?? []
      const items: ChecklistItem[] = rawItems.map((item) => ({
        label: item.label,
        required: item.required ?? false,
        checked: false,
        checked_by: null,
        checked_at: null,
      }))

      await supabase.from('plot_checklists').insert({
        plot_id: plotId,
        template_id: template.id,
        rule_id: rule.id,
        stage_id: toStageId,
        title: template.title,
        items: items as unknown as Json,
      })
    }
  }
}
