import { TopBar } from '@/components/layout/top-bar'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Toaster } from 'sonner'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('approved').eq('id', user.id).single()
  if (!profile?.approved) redirect('/pending')

  return (
    <div className="dark flex flex-col h-screen bg-background text-foreground">
      <TopBar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  )
}
