'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Map,
  Kanban,
  Archive,
  Settings,
  LogOut,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/plots', label: 'Участки', icon: Map },
  { href: '/board', label: 'Доска', icon: Kanban },
  { href: '/archive', label: 'Архив', icon: Archive },
  { href: '/settings', label: 'Настройки', icon: Settings },
]

type UserProfile = { full_name: string | null; avatar_url: string | null }

export function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data)
    }
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 bg-card border-r border-border flex-col z-40">
        {/* Logo */}
        <Link href="/dashboard" className="px-4 py-4 border-b border-border flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">У</span>
          <span className="font-semibold text-[15px] tracking-tight text-foreground">
            Uchastok<span className="text-primary">.kg</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer: profile + public link + sign out */}
        <div className="px-2.5 pb-3 space-y-0.5">
          {profile && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1 border-b border-border pb-3">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="w-7 h-7 rounded-full shrink-0 object-cover" />
              ) : (
                <div
                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-primary-foreground"
                  style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
                >
                  {(profile.full_name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
              )}
              <span className="text-sm text-foreground truncate font-medium">{profile.full_name ?? 'Пользователь'}</span>
            </div>
          )}
          <a
            href="/listings"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Globe className="w-4 h-4 shrink-0" />
            Публичный сайт ↗
          </a>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-1 bg-card border-t border-border safe-area-bottom">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-lg transition-colors min-w-0',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-medium truncate">{label}</span>
            </Link>
          )
        })}
        <a
          href="/listings"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-lg text-muted-foreground transition-colors"
        >
          <Globe className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-medium">Сайт</span>
        </a>
        <button
          onClick={signOut}
          className="flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-lg text-muted-foreground transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-medium">Выйти</span>
        </button>
      </nav>
    </>
  )
}
