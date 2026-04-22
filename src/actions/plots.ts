'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculateScore } from '@/lib/scoring/engine'
import type { PlotInsert, PlotUpdate } from '@/types/plot'

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return { supabase, user }
}

async function requireMember(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  if (profile?.role === 'viewer') throw new Error('Нет доступа')
}

export async function recalculatePlotScore(plotId: string) {
  const { supabase } = await getUser()

  // Fetch calculator snapshot
  const { data: calc } = await supabase
    .from('calculator_snapshots')
    .select('roi_pct, irr_pct')
    .eq('plot_id', plotId)
    .maybeSingle()

  // Fetch scoring inputs and plot fields (including infra booleans)
  const [{ data: si }, { data: plot }] = await Promise.all([
    supabase.from('scoring_inputs').select('*').eq('plot_id', plotId).maybeSingle(),
    supabase.from('plots').select('legal_clearance, infra_electricity, infra_water, infra_gas, infra_sewer').eq('id', plotId).single(),
  ])

  // Derive infrastructure_score (0–100) from boolean fields
  const infraValues = [plot?.infra_electricity, plot?.infra_water, plot?.infra_gas, plot?.infra_sewer]
  const knownInfra = infraValues.filter(v => v !== null && v !== undefined)
  const infrastructure_score = knownInfra.length > 0
    ? Math.round((knownInfra.filter(Boolean).length / knownInfra.length) * 100)
    : si?.infrastructure_score ?? null

  const breakdown = calculateScore({
    roi_pct: calc?.roi_pct ?? null,
    irr_pct: calc?.irr_pct ?? null,
    location_quality: si?.location_quality ?? null,
    legal_clearance: plot?.legal_clearance ?? false,
    infrastructure_score,
    price_vs_market_pct: si?.price_vs_market_pct ?? null,
    buildout_potential: si?.buildout_potential ?? null,
  })

  await supabase
    .from('plots')
    .update({ score: breakdown.total, score_breakdown: breakdown as unknown as import('@/types/database.types').Json })
    .eq('id', plotId)

  return breakdown
}

// ─────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────
export async function createPlot(data: Omit<PlotInsert, 'created_by'>) {
  const { supabase, user } = await getUser()
  await requireMember(supabase, user.id)

  const { data: plot, error } = await supabase
    .from('plots')
    .insert({ ...data, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await recalculatePlotScore(plot.id)

  // Log plot creation to activity feed
  await supabase.from('plot_activity').insert({
    plot_id: plot.id,
    actor_id: user.id,
    action_type: 'plot_created',
    payload: {},
  })

  return plot
}

export async function updatePlot(plotId: string, data: PlotUpdate) {
  const { supabase, user } = await getUser()
  await requireMember(supabase, user.id)

  const { error } = await supabase
    .from('plots')
    .update(data)
    .eq('id', plotId)

  if (error) throw new Error(error.message)

  await recalculatePlotScore(plotId)

  revalidatePath(`/plots/${plotId}`)
}

export async function archivePlot(plotId: string) {
  const { supabase, user } = await getUser()
  await requireMember(supabase, user.id)

  const { error } = await supabase
    .from('plots')
    .update({
      archived: true,
      archived_at: new Date().toISOString(),
      archived_by: user.id,
    })
    .eq('id', plotId)

  if (error) throw new Error(error.message)

  await supabase.from('plot_activity').insert({
    plot_id: plotId, actor_id: user.id, action_type: 'plot_archived', payload: {},
  })

  revalidatePath(`/plots/${plotId}`)
}

export async function deletePlot(plotId: string) {
  const { supabase, user } = await getUser()
  await requireMember(supabase, user.id)
  const { error } = await supabase.from('plots').delete().eq('id', plotId)
  if (error) throw new Error(error.message)
}

export async function togglePublishPlot(plotId: string, published: boolean) {
  const { supabase, user } = await getUser()
  await requireMember(supabase, user.id)

  const { error } = await supabase
    .from('plots')
    .update({ published })
    .eq('id', plotId)

  if (error) throw new Error(error.message)

  await supabase.from('plot_activity').insert({
    plot_id: plotId,
    actor_id: user.id,
    action_type: published ? 'plot_published' : 'plot_unpublished',
    payload: {},
  })

  revalidatePath(`/plots/${plotId}`)
  revalidatePath('/listings')
}

export async function unarchivePlot(plotId: string) {
  const { supabase, user } = await getUser()
  await requireMember(supabase, user.id)

  const { error } = await supabase
    .from('plots')
    .update({ archived: false, archived_at: null, archived_by: null })
    .eq('id', plotId)

  if (error) throw new Error(error.message)

  revalidatePath(`/plots/${plotId}`)
}

export async function saveScoringInputs(
  plotId: string,
  inputs: {
    location_quality?: number | null
    infrastructure_score?: number | null
    price_vs_market_pct?: number | null
    buildout_potential?: number | null
  }
) {
  const { supabase, user } = await getUser()
  await requireMember(supabase, user.id)

  await supabase
    .from('scoring_inputs')
    .upsert({ plot_id: plotId, ...inputs }, { onConflict: 'plot_id' })

  await recalculatePlotScore(plotId)
  revalidatePath(`/plots/${plotId}`)
}

export async function saveCalculatorSnapshot(plotId: string, inputs: Record<string, number | null>, outputs: Record<string, number | null>) {
  const { supabase, user } = await getUser()
  await requireMember(supabase, user.id)

  const { error } = await supabase
    .from('calculator_snapshots')
    .upsert({ plot_id: plotId, ...inputs, ...outputs }, { onConflict: 'plot_id' })

  if (error) throw new Error(error.message)

  await recalculatePlotScore(plotId)
  revalidatePath(`/plots/${plotId}`)
}
