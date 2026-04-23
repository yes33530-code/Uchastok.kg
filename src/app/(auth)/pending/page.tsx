import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Clock } from 'lucide-react'

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in at all → go to login
  if (!user) redirect('/login')

  // Already approved → go to app
  const { data: profile } = await supabase.from('profiles').select('approved').eq('id', user.id).single()
  if (profile?.approved) redirect('/dashboard')

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20">
            <Clock className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-foreground mb-2">Ожидание подтверждения</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ваш аккаунт ({user.email}) создан, но доступ ещё не предоставлен.
            Администратор должен одобрить вашу учётную запись.
          </p>
        </div>

        <div className="rounded-lg p-4 text-left space-y-1 bg-card border border-border">
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Что дальше?</p>
          <p className="text-sm text-foreground/80">
            Обратитесь к администратору системы, чтобы он одобрил ваш доступ в разделе Настройки → Пользователи.
          </p>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Выйти из аккаунта
          </button>
        </form>
      </div>
    </div>
  )
}
