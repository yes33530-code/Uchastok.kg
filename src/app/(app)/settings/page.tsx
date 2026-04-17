import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { AutomationManager } from '@/components/automations/automation-form'
import { UserManagement } from '@/components/settings/user-management'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Настройки — Uchastok.kg' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  const [{ data: stages }, { data: rules }, { data: allProfiles }] = await Promise.all([
    supabase.from('kanban_stages').select('*').order('position'),
    supabase.from('automation_rules').select('*, checklist_templates(*)').order('created_at'),
    supabase.from('profiles').select('id, full_name, avatar_url, role, approved, created_at').order('created_at'),
  ])

  const isAdmin = profile?.role === 'admin'

  return (
    <>
      <Topbar title="Настройки" />
      <main className="flex-1 overflow-y-auto p-3 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Automations */}
          <div className="rounded-xl p-5 md:p-6" style={{ backgroundColor: '#142a50', border: '1px solid rgba(255,255,255,0.08)' }}>
            {isAdmin ? (
              <AutomationManager
                stages={stages ?? []}
                rules={(rules ?? []) as Parameters<typeof AutomationManager>[0]['rules']}
              />
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-2">Автоматизации</h3>
                <p className="text-sm text-white/40">Только администраторы могут управлять автоматизациями.</p>
              </div>
            )}
          </div>

          {/* Users */}
          <div className="rounded-xl p-5 md:p-6" style={{ backgroundColor: '#142a50', border: '1px solid rgba(255,255,255,0.08)' }}>
            {isAdmin ? (
              <UserManagement profiles={allProfiles ?? []} currentUserId={user.id} />
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-2">Пользователи</h3>
                <p className="text-sm text-white/40">Только администраторы могут управлять пользователями.</p>
              </div>
            )}
          </div>

          {/* Stages */}
          <div className="rounded-xl p-5 md:p-6" style={{ backgroundColor: '#142a50', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-semibold text-white/80 mb-4">Стадии Канбан-доски</h3>
            <div className="space-y-2">
              {(stages ?? []).map(stage => (
                <div key={stage.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm text-white/70">{stage.position}. {stage.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/30 mt-4">Для изменения стадий обратитесь к администратору базы данных.</p>
          </div>
        </div>
      </main>
    </>
  )
}
