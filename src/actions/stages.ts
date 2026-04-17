'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { runAutomations } from '@/lib/automations/runner'

export async function updateStagePositions(updates: { id: string; position: number }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  await Promise.all(updates.map(({ id, position }) =>
    supabase.from('kanban_stages').update({ position }).eq('id', id)
  ))
  revalidatePath('/board')
}

export async function updatePlotPositions(updates: { id: string; position: number }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  await Promise.all(updates.map(({ id, position }) =>
    supabase.from('plots').update({ position }).eq('id', id)
  ))
}

export async function renameStage(stageId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('kanban_stages').update({ name }).eq('id', stageId)
  if (error) throw new Error(error.message)
  revalidatePath('/board')
}

export async function createStage(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: stages } = await supabase.from('kanban_stages').select('position').order('position', { ascending: false }).limit(1)
  const nextPosition = (stages?.[0]?.position ?? -1) + 1
  const { data, error } = await supabase
    .from('kanban_stages')
    .insert({ name, position: nextPosition, color: '#6366f1' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/board')
  return data
}

export async function moveToStage(plotId: string, toStageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get current stage for audit log
  const { data: plot } = await supabase
    .from('plots')
    .select('stage_id')
    .eq('id', plotId)
    .single()

  // Update plot stage
  const { error } = await supabase
    .from('plots')
    .update({ stage_id: toStageId })
    .eq('id', plotId)

  if (error) throw new Error(error.message)

  // Log the stage change (existing audit table)
  await supabase.from('stage_change_log').insert({
    plot_id: plotId,
    from_stage_id: plot?.stage_id ?? null,
    to_stage_id: toStageId,
    changed_by: user.id,
  })

  // Log to activity feed with stage names for display
  const stageIds = [plot?.stage_id, toStageId].filter((id): id is string => Boolean(id))
  const { data: stages } = stageIds.length
    ? await supabase.from('kanban_stages').select('id,name').in('id', stageIds)
    : { data: [] }
  const stageMap = Object.fromEntries((stages ?? []).map(s => [s.id, s.name]))
  await supabase.from('plot_activity').insert({
    plot_id: plotId,
    actor_id: user.id,
    action_type: 'stage_changed',
    payload: {
      from_stage: plot?.stage_id ? (stageMap[plot.stage_id] ?? null) : null,
      to_stage: stageMap[toStageId] ?? null,
    },
  })

  // Run automations
  await runAutomations(plotId, toStageId, user.id)

  revalidatePath('/board')
  revalidatePath(`/plots/${plotId}`)
}
