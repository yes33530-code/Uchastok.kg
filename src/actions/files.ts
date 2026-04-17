'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return { supabase, user }
}

export async function getSignedUploadUrl(plotId: string, fileName: string): Promise<{ signedUrl: string; token: string; storagePath: string }> {
  const { supabase } = await getUser()
  const ext = fileName.split('.').pop()
  const storagePath = `${plotId}/${crypto.randomUUID()}.${ext}`
  const { data, error } = await supabase.storage
    .from('Plot Files')
    .createSignedUploadUrl(storagePath)
  if (error) throw new Error(error.message)
  return { signedUrl: data.signedUrl, token: data.token, storagePath }
}

export async function saveFileRecord(
  plotId: string,
  storagePath: string,
  name: string,
  mimeType: string,
  size: number,
): Promise<{ id: string; plot_id: string; name: string; size: number | null; mime_type: string | null; storage_path: string; uploaded_by: string | null; created_at: string }> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('plot_files')
    .insert({ plot_id: plotId, name, size, mime_type: mimeType, storage_path: storagePath, uploaded_by: user.id })
    .select()
    .single()
  if (error) {
    await supabase.storage.from('Plot Files').remove([storagePath])
    throw new Error(error.message)
  }
  revalidatePath(`/plots/${plotId}`)
  return data
}

export async function deletePlotFile(fileId: string, storagePath: string, plotId: string) {
  const { supabase } = await getUser()
  await supabase.storage.from('Plot Files').remove([storagePath])
  await supabase.from('plot_files').delete().eq('id', fileId)
  revalidatePath(`/plots/${plotId}`)
}

export async function getPlotFileUrl(storagePath: string): Promise<string> {
  const { supabase } = await getUser()
  const { data } = await supabase.storage
    .from('Plot Files')
    .createSignedUrl(storagePath, 60 * 60)
  return data?.signedUrl ?? ''
}
