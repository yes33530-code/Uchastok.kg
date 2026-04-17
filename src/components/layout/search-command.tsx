'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Archive } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Plot } from '@/types/plot'

export function SearchCommand() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Plot[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // CMD+K focuses the input
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Close when clicking outside the container
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('plots')
      .select('*')
      .or(`address.ilike.%${q}%,contact_name.ilike.%${q}%,notes.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(10)
    setResults(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200)
    return () => clearTimeout(timer)
  }, [query, search])

  function navigate(plotId: string) {
    setOpen(false)
    setQuery('')
    if (pathname === '/board') {
      router.push(`/board?open=${plotId}`)
    } else {
      router.push(`/plots/${plotId}`)
    }
  }

  const showDropdown = open

  return (
    <div ref={containerRef} className="relative w-full max-w-xs md:max-w-sm lg:max-w-md">
      {/* Search bar */}
      <div
        className="flex items-center gap-2 text-sm border rounded-lg px-3 py-1.5 transition-colors"
        style={{
          backgroundColor: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
          borderColor: open ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
        }}
      >
        <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Поиск"
          className="flex-1 bg-transparent outline-none text-white placeholder-white/40 text-sm min-w-0"
        />
        {!open && (
          <kbd className="text-xs bg-white/10 border border-white/10 rounded px-1.5 py-0.5 text-white/30 shrink-0">
            Ctrl+K
          </kbd>
        )}
        {open && query && (
          <button
            onMouseDown={e => { e.preventDefault(); setQuery(''); setResults([]) }}
            className="text-white/30 hover:text-white/60 text-xs shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl overflow-hidden z-50"
          style={{ backgroundColor: '#112545', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="px-4 py-6 text-center text-sm text-white/30">Поиск...</div>
            )}
            {!loading && query && results.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-white/30">Ничего не найдено</div>
            )}
            {!loading && !query && (
              <div className="px-4 py-6 text-center text-sm text-white/30">Начните вводить адрес или имя контакта</div>
            )}
            {results.map((plot, i) => (
              <button
                key={plot.id}
                onMouseDown={e => { e.preventDefault(); navigate(plot.id) }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors"
                style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/80 truncate">{plot.address}</span>
                    {plot.archived && (
                      <span className="flex items-center gap-1 text-xs bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full shrink-0">
                        <Archive className="w-3 h-3" /> Архив
                      </span>
                    )}
                  </div>
                  {plot.contact_name && (
                    <p className="text-xs text-white/30 truncate">{plot.contact_name}</p>
                  )}
                </div>
                <span className="text-xs text-white/30 shrink-0">{plot.size_sotok} сот.</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
