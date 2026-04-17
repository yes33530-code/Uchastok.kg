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
    <div className="min-h-screen flex items-center justify-center bg-[#0e2040] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <Clock className="w-8 h-8 text-indigo-400" />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-white mb-2">Ожидание подтверждения</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Ваш аккаунт ({user.email}) создан, но доступ ещё не предоставлен.
            Администратор должен одобрить вашу учётную запись.
          </p>
        </div>

        <div
          className="rounded-xl p-4 text-left space-y-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs text-white/40 font-medium uppercase tracking-wide">Что дальше?</p>
          <p className="text-sm text-white/60">Обратитесь к администратору системы, чтобы он одобрил ваш доступ в разделе Настройки → Пользователи.</p>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-white/30 hover:text-white/60 underline transition-colors"
          >
            Выйти из аккаунта
          </button>
        </form>
      </div>
    </div>
  )
}
