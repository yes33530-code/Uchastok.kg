import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Sync Google profile data into profiles table
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const meta = authUser.user_metadata
        await supabase.from('profiles').upsert({
          id: authUser.id,
          full_name: (meta.full_name ?? meta.name ?? null) as string | null,
          avatar_url: (meta.avatar_url ?? meta.picture ?? null) as string | null,
        }, { onConflict: 'id' })
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
