import { createClient } from '@/lib/supabase/server'
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
      <main className="flex-1 overflow-y-auto p-3 md:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-5">
            <h2 className="text-[18px] font-semibold text-foreground leading-tight">Настройки</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Автоматизации, пользователи и стадии воронки.</p>
          </div>

          <div className="rounded-lg bg-card ring-1 ring-white/[0.08] shadow-2xl p-5 md:p-6 space-y-5">
            {/* Automations */}
            <section>
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Автоматизации</h4>
              <div className="rounded-md p-4 bg-[var(--list)]/60 border border-border">
                {isAdmin ? (
                  <AutomationManager
                    stages={stages ?? []}
                    rules={(rules ?? []) as Parameters<typeof AutomationManager>[0]['rules']}
                  />
                ) : (
                  <p className="text-[13px] text-muted-foreground">Только администраторы могут управлять автоматизациями.</p>
                )}
              </div>
            </section>

            {/* Users */}
            <section>
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Пользователи</h4>
              <div className="rounded-md p-4 bg-[var(--list)]/60 border border-border">
                {isAdmin ? (
                  <UserManagement profiles={allProfiles ?? []} currentUserId={user.id} />
                ) : (
                  <p className="text-[13px] text-muted-foreground">Только администраторы могут управлять пользователями.</p>
                )}
              </div>
            </section>

            {/* Stages */}
            <section>
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Стадии Канбан-доски</h4>
              <div className="rounded-md p-4 bg-[var(--list)]/60 border border-border">
                <div className="space-y-1">
                  {(stages ?? []).map(stage => (
                    <div key={stage.id} className="flex items-center gap-2.5 py-1">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                      <span className="text-[13px] text-foreground/90 tabular-nums">{stage.position}. {stage.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">Для изменения стадий обратитесь к администратору базы данных.</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
