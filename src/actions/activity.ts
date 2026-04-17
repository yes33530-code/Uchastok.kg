'use server'
import { createClient } from '@/lib/supabase/server'
import type { PlotCommentWithProfile, PlotActivityWithProfile } from '@/types/plot'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return { supabase, user }
}

// ─────────────────────────────────────────
// Comments
// ─────────────────────────────────────────

export async function getComments(plotId: string): Promise<PlotCommentWithProfile[]> {
  const { supabase } = await getUser()
  const { data, error } = await supabase
    .from('plot_comments')
    .select('*, profiles(full_name, avatar_url)')
    .eq('plot_id', plotId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as PlotCommentWithProfile[]
}

export async function addComment(plotId: string, body: string): Promise<PlotCommentWithProfile> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('plot_comments')
    .insert({ plot_id: plotId, body: body.trim(), created_by: user.id })
    .select('*, profiles(full_name, avatar_url)')
    .single()
  if (error) throw new Error(error.message)

  // Log activity
  await supabase.from('plot_activity').insert({
    plot_id: plotId,
    actor_id: user.id,
    action_type: 'comment_added',
    payload: { comment_id: (data as any).id, preview: body.trim().slice(0, 80) },
  })

  return data as PlotCommentWithProfile
}

export async function deleteComment(commentId: string, plotId: string): Promise<void> {
  const { supabase, user } = await getUser()

  // Fetch body preview before deleting for activity log
  const { data: existing } = await supabase
    .from('plot_comments')
    .select('body')
    .eq('id', commentId)
    .single()

  const { error } = await supabase
    .from('plot_comments')
    .delete()
    .eq('id', commentId)
    .eq('created_by', user.id)  // extra ownership guard
  if (error) throw new Error(error.message)

  await supabase.from('plot_activity').insert({
    plot_id: plotId,
    actor_id: user.id,
    action_type: 'comment_deleted',
    payload: { preview: existing?.body?.slice(0, 80) ?? '' },
  })
}

// ─────────────────────────────────────────
// Activity
// ─────────────────────────────────────────

export async function getActivity(plotId: string): Promise<PlotActivityWithProfile[]> {
  const { supabase } = await getUser()
  const { data, error } = await supabase
    .from('plot_activity')
    .select('*, profiles(full_name, avatar_url)')
    .eq('plot_id', plotId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as PlotActivityWithProfile[]
}

export async function logActivity(
  plotId: string,
  actionType: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const { supabase, user } = await getUser()
  await supabase.from('plot_activity').insert({
    plot_id: plotId,
    actor_id: user.id,
    action_type: actionType,
    payload: payload as import('@/types/database.types').Json,
  })
}
