'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ChecklistItem } from '@/types/plot'

export async function createAutomationRule(data: {
  name: string
  trigger_stage_id: string
  checklist_title: string
  checklist_items: { label: string; required: boolean }[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Admin only')

  const { data: rule, error: ruleError } = await supabase
    .from('automation_rules')
    .insert({
      name: data.name,
      trigger_stage_id: data.trigger_stage_id,
      created_by: user.id,
    })
    .select()
    .single()

  if (ruleError) throw new Error(ruleError.message)

  const { error: templateError } = await supabase
    .from('checklist_templates')
    .insert({
      rule_id: rule.id,
      title: data.checklist_title,
      items: data.checklist_items,
    })

  if (templateError) throw new Error(templateError.message)

  revalidatePath('/settings')
  return rule
}

export async function toggleAutomationRule(ruleId: string, enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('automation_rules')
    .update({ enabled })
    .eq('id', ruleId)

  revalidatePath('/settings')
}

export async function deleteAutomationRule(ruleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('automation_rules').delete().eq('id', ruleId)

  revalidatePath('/settings')
}

export async function updateChecklistItem(
  checklistId: string,
  itemIndex: number,
  checked: boolean,
  userId: string
) {
  const supabase = await createClient()

  const { data: checklist } = await supabase
    .from('plot_checklists')
    .select('items')
    .eq('id', checklistId)
    .single()

  if (!checklist) throw new Error('Checklist not found')

  const items = (checklist.items as unknown as ChecklistItem[]).map((item, i) => {
    if (i !== itemIndex) return item
    return {
      ...item,
      checked,
      checked_by: checked ? userId : null,
      checked_at: checked ? new Date().toISOString() : null,
    }
  })

  await supabase
    .from('plot_checklists')
    .update({ items: items as unknown as import('@/types/database.types').Json })
    .eq('id', checklistId)
}
