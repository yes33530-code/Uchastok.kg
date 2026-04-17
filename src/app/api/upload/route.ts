import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'viewer') return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const plotId = formData.get('plotId') as string

  if (!file || !plotId) return NextResponse.json({ error: 'Missing file or plotId' }, { status: 400 })
  if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: 'Файл превышает 50 МБ' }, { status: 400 })

  // Verify the plot exists and is accessible to this user before uploading
  const { data: plot } = await supabase.from('plots').select('id').eq('id', plotId).single()
  if (!plot) return NextResponse.json({ error: 'Plot not found' }, { status: 404 })

  const ext = file.name.split('.').pop()
  const storagePath = `${plotId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('Plot Files')
    .upload(storagePath, file, { contentType: file.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: row, error: dbError } = await supabase
    .from('plot_files')
    .insert({ plot_id: plotId, name: file.name, size: file.size, mime_type: file.type, storage_path: storagePath, uploaded_by: user.id })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from('Plot Files').remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ file: row })
}
