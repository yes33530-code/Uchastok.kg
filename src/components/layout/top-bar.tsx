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
  MoreHorizontal,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { SearchCommand } from './search-command'

const NAV = [
  { href: '/board',     label: 'Доска',     icon: Kanban },
  { href: '/plots',     label: 'Участки',   icon: Map },
  { href: '/dashboard', label: 'Дашборд',   icon: LayoutDashboard },
  { href: '/archive',   label: 'Архив',     icon: Archive },
  { href: '/settings',  label: 'Настройки', icon: Settings },
]

type UserProfile = { full_name: string | null; avatar_url: string | null }

export function TopBar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

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

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const current = NAV.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))

  return (
    <>
      <header className="shrink-0 h-12 flex items-center gap-3 px-3 bg-[var(--sidebar)] border-b border-border z-30">
        {/* Brand */}
        <Link href="/board" className="flex items-center gap-2 px-2 h-8 rounded hover:bg-white/[0.06] transition-colors">
          <span className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-[12px]">У</span>
          <span className="font-semibold text-[14px] tracking-tight text-foreground">
            Uchastok<span className="text-primary">.kg</span>
          </span>
        </Link>

        {/* Current page breadcrumb */}
        {current && (
          <>
            <span className="text-muted-foreground/50 text-xs">/</span>
            <span className="text-[13px] font-medium text-foreground/90 truncate">
              {current.label}
            </span>
          </>
        )}

        {/* Search — keyboard ⌘/Ctrl+K */}
        <div className="flex-1 flex justify-center max-w-xl mx-auto">
          <SearchCommand />
        </div>

        {/* Public site */}
        <a
          href="/listings"
          target="_blank"
          rel="noopener noreferrer"
          title="Публичный сайт"
          className="hidden sm:flex items-center gap-1.5 px-2 h-8 rounded text-[13px] text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden md:inline">Сайт</span>
        </a>

        {/* Avatar */}
        {profile && (
          profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name ?? ''}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-1 ring-border"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
              title={profile.full_name ?? ''}
            >
              {(profile.full_name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
          )
        )}

        {/* Menu trigger */}
        <button
          onClick={() => setMenuOpen(true)}
          title="Меню"
          className="flex items-center justify-center w-8 h-8 rounded text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </header>

      {/* Right-side slide-out menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setMenuOpen(false)}
        >
          <aside
            className="absolute top-0 right-0 h-full w-[320px] max-w-[85vw] bg-[var(--sidebar)] border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="h-12 shrink-0 flex items-center px-3 border-b border-border">
              <span className="text-[13px] font-semibold text-foreground uppercase tracking-wide">Меню</span>
              <div className="flex-1" />
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile */}
            {profile && (
              <div className="px-3 py-3 flex items-center gap-3 border-b border-border">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="w-9 h-9 rounded-full object-cover ring-1 ring-border" />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white ring-1 ring-border"
                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                  >
                    {(profile.full_name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground truncate">{profile.full_name ?? 'Пользователь'}</p>
                </div>
              </div>
            )}

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-2">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 text-[14px] transition-colors',
                      active
                        ? 'text-foreground bg-white/[0.08] font-semibold'
                        : 'text-foreground/80 hover:text-foreground hover:bg-white/[0.04]'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                    {label}
                  </Link>
                )
              })}

              <div className="my-2 mx-4 border-t border-border" />

              <a
                href="/listings"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2 text-[14px] text-foreground/80 hover:text-foreground hover:bg-white/[0.04] transition-colors"
              >
                <Globe className="w-4 h-4 shrink-0 text-muted-foreground" />
                Публичный сайт ↗
              </a>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-[14px] text-foreground/80 hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0 text-muted-foreground" />
                Выйти
              </button>
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}
