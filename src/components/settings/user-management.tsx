'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { toggleUserRole, approveUser, revokeUser } from '@/actions/users'
import { formatDate } from '@/lib/utils'

type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string
  approved: boolean
  created_at: string
}

export function UserManagement({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const [loading, setLoading] = useState<string | null>(null)

  const pending = profiles.filter(p => !p.approved)
  const approved = profiles.filter(p => p.approved)

  async function handleApprove(profile: Profile) {
    setLoading(profile.id + '_approve')
    try {
      await approveUser(profile.id)
      toast.success(`${profile.full_name ?? 'Пользователь'} одобрен`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
    setLoading(null)
  }

  async function handleRevoke(profile: Profile) {
    setLoading(profile.id + '_revoke')
    try {
      await revokeUser(profile.id)
      toast.success(`Доступ отозван`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
    setLoading(null)
  }

  async function handleToggleRole(profile: Profile) {
    const newRole = profile.role === 'admin' ? 'member' : 'admin'
    setLoading(profile.id + '_role')
    try {
      await toggleUserRole(profile.id, newRole)
      toast.success(`${profile.full_name ?? 'Пользователь'} теперь ${newRole === 'admin' ? 'администратор' : 'участник'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
    setLoading(null)
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-white/80 mb-4">Пользователи</h3>

      {/* Pending approval */}
      {pending.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-amber-400/80 uppercase tracking-wide mb-2">
            Ожидают одобрения ({pending.length})
          </p>
          <div className="space-y-2">
            {pending.map(profile => (
              <UserRow
                key={profile.id}
                profile={profile}
                isMe={false}
                loading={loading}
                onApprove={() => handleApprove(profile)}
                onRevoke={null}
                onToggleRole={null}
              />
            ))}
          </div>
        </div>
      )}

      {/* Approved users */}
      {approved.length > 0 && (
        <div>
          {pending.length > 0 && (
            <p className="text-xs font-medium text-white/30 uppercase tracking-wide mb-2">
              Активные ({approved.length})
            </p>
          )}
          <div className="space-y-2">
            {approved.map(profile => (
              <UserRow
                key={profile.id}
                profile={profile}
                isMe={profile.id === currentUserId}
                loading={loading}
                onApprove={null}
                onRevoke={profile.id !== currentUserId ? () => handleRevoke(profile) : null}
                onToggleRole={profile.id !== currentUserId ? () => handleToggleRole(profile) : null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UserRow({ profile, isMe, loading, onApprove, onRevoke, onToggleRole }: {
  profile: Profile
  isMe: boolean
  loading: string | null
  onApprove: (() => void) | null
  onRevoke: (() => void) | null
  onToggleRole: (() => void) | null
}) {
  const initials = (profile.full_name ?? '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div
      className="flex items-center gap-3 py-2.5 px-3 rounded-lg"
      style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="w-8 h-8 rounded-full shrink-0 object-cover" />
      ) : (
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          {initials}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 font-medium truncate">
          {profile.full_name ?? 'Пользователь'}
          {isMe && <span className="ml-2 text-xs text-white/30">(вы)</span>}
        </p>
        <p className="text-xs text-white/30">с {formatDate(profile.created_at)}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        {/* Approve pending user */}
        {onApprove && (
          <button
            onClick={onApprove}
            disabled={loading === profile.id + '_approve'}
            className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40"
            style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            {loading === profile.id + '_approve' ? '...' : 'Одобрить'}
          </button>
        )}

        {/* Role badge (approved users only) */}
        {profile.approved && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: profile.role === 'admin' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
              color: profile.role === 'admin' ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
            }}
          >
            {profile.role === 'admin' ? 'Админ' : 'Участник'}
          </span>
        )}

        {/* Toggle role */}
        {onToggleRole && (
          <button
            onClick={onToggleRole}
            disabled={loading === profile.id + '_role'}
            className="text-xs text-white/35 hover:text-white/65 underline disabled:opacity-40 transition-colors"
          >
            {loading === profile.id + '_role' ? '...' : profile.role === 'admin' ? 'Снять' : 'Сделать админом'}
          </button>
        )}

        {/* Revoke access */}
        {onRevoke && (
          <button
            onClick={onRevoke}
            disabled={loading === profile.id + '_revoke'}
            className="text-xs text-red-400/50 hover:text-red-400 underline disabled:opacity-40 transition-colors"
          >
            {loading === profile.id + '_revoke' ? '...' : 'Отозвать'}
          </button>
        )}
      </div>
    </div>
  )
}
