'use client'
import { useState } from 'react'
import { Archive, ArchiveRestore } from 'lucide-react'
import { toast } from 'sonner'
import { archivePlot, unarchivePlot } from '@/actions/plots'

export function ArchiveButton({ plotId, archived }: { plotId: string; archived: boolean }) {
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      if (archived) {
        await unarchivePlot(plotId)
        toast.success('Участок восстановлен из архива')
      } else {
        await archivePlot(plotId)
        toast.success('Участок перемещён в архив')
      }
    } catch {
      toast.error('Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
        archived
          ? 'text-emerald-400 hover:bg-emerald-500/10'
          : 'text-amber-400 hover:bg-amber-500/10'
      }`}
      style={{ border: `1px solid ${archived ? 'rgba(52,211,153,0.25)' : 'rgba(251,191,36,0.25)'}` }}
    >
      {archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
      {archived ? 'Восстановить' : 'В архив'}
    </button>
  )
}
