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
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium border transition-colors disabled:opacity-50 ${
        archived
          ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
          : 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
      }`}
    >
      {archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
      {archived ? 'Восстановить' : 'В архив'}
    </button>
  )
}
