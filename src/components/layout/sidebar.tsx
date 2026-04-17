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
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 bg-[#142a50] flex-col z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <span className="text-white font-bold text-lg tracking-tight">Uchastok.kg</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Public listing link + Sign out */}
        <div className="px-3 pb-4 space-y-0.5">
          {/* Current user */}
          {profile && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="w-7 h-7 rounded-full shrink-0 object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {(profile.full_name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
              )}
              <span className="text-sm text-white/70 truncate">{profile.full_name ?? 'Пользователь'}</span>
            </div>
          )}
          <a
            href="/listings"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Globe className="w-4 h-4 shrink-0" />
            Публичный сайт ↗
          </a>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom navigation ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 safe-area-bottom"
        style={{ backgroundColor: '#142a50', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg transition-colors min-w-0',
                active ? 'text-white' : 'text-white/40'
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0', active && 'text-indigo-400')} />
              <span className="text-[9px] font-medium truncate">{label}</span>
            </Link>
          )
        })}
        <button
          onClick={signOut}
          className="flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg text-white/40 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-medium">Выйти</span>
        </button>
      </nav>
    </>
  )
}
