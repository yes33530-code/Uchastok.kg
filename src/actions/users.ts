'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function approveUser(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'admin') throw new Error('Недостаточно прав')

  const { error } = await supabase
    .from('profiles')
    .update({ approved: true })
    .eq('id', targetUserId)

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function revokeUser(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'admin') throw new Error('Недостаточно прав')

  const { error } = await supabase
    .from('profiles')
    .update({ approved: false })
    .eq('id', targetUserId)

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function toggleUserRole(targetUserId: string, newRole: 'admin' | 'member') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')

  // Only admins can change roles
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'admin') throw new Error('Недостаточно прав')

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId)

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}
