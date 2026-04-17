'use client'
import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Activity, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getComments, addComment, deleteComment, getActivity } from '@/actions/activity'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { PlotCommentWithProfile, PlotActivityWithProfile } from '@/types/plot'

interface Props {
  plotId: string
  userId: string
  userProfile?: { full_name: string | null; avatar_url: string | null } | null
  /** When true: renders as a full-height side pane with no collapsible wrapper */
  sidebar?: boolean
}

function Avatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  const initials = (name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? ''}
        className="w-7 h-7 rounded-full shrink-0 object-cover"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
      />
    )
  }
  return (
    <div
      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: '1px solid rgba(255,255,255,0.12)' }}
    >
      {initials}
    </div>
  )
}

function activityLabel(entry: PlotActivityWithProfile): string {
  const payload = (entry.payload ?? {}) as Record<string, string | null>
  switch (entry.action_type) {
    case 'plot_created':    return 'создал(а) карточку'
    case 'plot_archived':   return 'переместил(а) в архив'
    case 'plot_unarchived': return 'восстановил(а) из архива'
    case 'plot_published':  return 'опубликовал(а) на сайте'
    case 'plot_unpublished':return 'снял(а) с публикации'
    case 'stage_changed': {
      const from = payload.from_stage ? `«${payload.from_stage}»` : '(без стадии)'
      const to   = payload.to_stage   ? `«${payload.to_stage}»`   : '(без стадии)'
      return `переместил(а) из ${from} в ${to}`
    }
    case 'file_uploaded':   return `загрузил(а) файл «${payload.file_name ?? ''}»`
    case 'file_deleted':    return `удалил(а) файл «${payload.file_name ?? ''}»`
    case 'comment_added':   return 'оставил(а) комментарий'
    case 'comment_deleted': return 'удалил(а) комментарий'
    default: return entry.action_type.replace(/_/g, ' ')
  }
}

export function ActivityPanel({ plotId, userId, userProfile: userProfileProp, sidebar = false }: Props) {
  const [tab, setTab] = useState<'comments' | 'history'>('comments')
  const [comments, setComments] = useState<PlotCommentWithProfile[]>([])
  const [activity, setActivity] = useState<PlotActivityWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(userProfileProp ?? null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [c, a] = await Promise.all([getComments(plotId), getActivity(plotId)])
        setComments(c)
        setActivity(a)
      } catch { /* silent */ }
      setLoading(false)
    }
    load()
  }, [plotId])

  // Fetch profile if not passed as prop (e.g. when rendered inside card drawer)
  useEffect(() => {
    if (userProfileProp !== undefined) return
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single()
      if (data) setUserProfile(data)
    }
    fetchProfile()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    try {
      const comment = await addComment(plotId, body.trim())
      setComments(prev => [...prev, comment])
      // Also bump activity list
      const a = await getActivity(plotId)
      setActivity(a)
      setBody('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
    setSubmitting(false)
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm('Удалить комментарий?')) return
    try {
      await deleteComment(commentId, plotId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      const a = await getActivity(plotId)
      setActivity(a)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const inner = (
    <div className={sidebar ? 'flex flex-col h-full' : ''}>
      {/* Tabs */}
      <div className="flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <TabBtn
          label="Комментарии"
          icon={<MessageSquare className="w-3.5 h-3.5" />}
          count={comments.length}
          active={tab === 'comments'}
          onClick={() => setTab('comments')}
        />
        <TabBtn
          label="История"
          icon={<Activity className="w-3.5 h-3.5" />}
          count={activity.length}
          active={tab === 'history'}
          onClick={() => setTab('history')}
        />
      </div>

      <div className={`p-4 ${sidebar ? 'flex-1 overflow-y-auto' : ''}`}>
        {loading ? (
          <p className="text-xs text-white/30 text-center py-4">Загрузка...</p>
        ) : tab === 'comments' ? (
          <CommentsTab
            comments={comments}
            userId={userId}
            userProfile={userProfile}
            body={body}
            submitting={submitting}
            textareaRef={textareaRef}
            onBodyChange={setBody}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            onDelete={handleDelete}
          />
        ) : (
          <HistoryTab activity={activity} />
        )}
      </div>
    </div>
  )

  if (sidebar) {
    return (
      <div className="flex flex-col h-full">
        {/* Sidebar header */}
        <div
          className="shrink-0 px-4 py-3 flex items-center gap-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(0,0,0,0.2)' }}
        >
          <MessageSquare className="w-4 h-4 text-white/30" />
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">Активность</span>
        </div>
        {inner}
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Collapsible header (non-sidebar mode) */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <MessageSquare className="w-4 h-4 text-white/40" />
        <span className="text-sm font-semibold text-white/80">Комментарии и история</span>
      </div>
      {inner}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────

function TabBtn({
  label, icon, count, active, onClick,
}: {
  label: string; icon: React.ReactNode; count: number; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors flex-1 justify-center"
      style={{
        color: active ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
        borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
        backgroundColor: active ? 'rgba(99,102,241,0.06)' : 'transparent',
      }}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
          style={{
            backgroundColor: active ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
            color: active ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function CommentsTab({
  comments, userId, userProfile, body, submitting, textareaRef,
  onBodyChange, onSubmit, onKeyDown, onDelete,
}: {
  comments: PlotCommentWithProfile[]
  userId: string
  userProfile?: { full_name: string | null; avatar_url: string | null } | null
  body: string
  submitting: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onBodyChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Existing comments */}
      {comments.length === 0 ? (
        <p className="text-xs text-white/25 text-center py-2">Комментариев пока нет</p>
      ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar name={c.profiles?.full_name ?? null} avatarUrl={c.profiles?.avatar_url ?? null} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-white/80">
                    {c.profiles?.full_name ?? 'Пользователь'}
                  </span>
                  <span className="text-xs text-white/25">{formatDate(c.created_at)}</span>
                </div>
                <div
                  className="mt-1 text-sm text-white/70 leading-relaxed rounded-lg px-3 py-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {c.body}
                </div>
                {c.created_by === userId && (
                  <button
                    onClick={() => onDelete(c.id)}
                    className="mt-1 flex items-center gap-1 text-xs text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Удалить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New comment form */}
      <form onSubmit={onSubmit} className="flex gap-2.5">
        <div className="mt-0.5">
          <Avatar name={userProfile?.full_name ?? null} avatarUrl={userProfile?.avatar_url ?? null} />
        </div>
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={e => onBodyChange(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder="Написать комментарий... (Ctrl+Enter для отправки)"
            className="w-full text-sm text-white/80 rounded-lg px-3 py-2 resize-none placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          {body.trim() && (
            <button
              type="submit"
              disabled={submitting}
              className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Send className="w-3 h-3" />
              {submitting ? 'Отправка...' : 'Отправить'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function HistoryTab({ activity }: { activity: PlotActivityWithProfile[] }) {
  if (activity.length === 0) {
    return <p className="text-xs text-white/25 text-center py-2">История действий пуста</p>
  }
  return (
    <div className="space-y-2.5">
      {activity.map(entry => (
        <div key={entry.id} className="flex gap-2.5">
          <Avatar
            name={entry.profiles?.full_name ?? null}
            avatarUrl={entry.profiles?.avatar_url ?? null}
          />
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-xs text-white/60 leading-relaxed">
              <span className="font-semibold text-white/80">
                {entry.profiles?.full_name ?? 'Пользователь'}
              </span>
              {' '}
              {activityLabel(entry)}
            </p>
            <p className="text-xs text-white/25 mt-0.5">{formatDate(entry.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
