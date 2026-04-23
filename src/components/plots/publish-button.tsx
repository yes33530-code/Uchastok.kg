'use client'
import { useState } from 'react'
import { Globe, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { togglePublishPlot } from '@/actions/plots'

export function PublishButton({ plotId, published }: { plotId: string; published: boolean }) {
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      await togglePublishPlot(plotId, !published)
      toast.success(published ? 'Снято с публикации' : 'Опубликовано на сайте')
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
        published
          ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
          : 'text-muted-foreground border-border hover:text-foreground hover:bg-muted'
      }`}
    >
      {published ? <Globe className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      {published ? 'Опубликовано' : 'Опубликовать'}
    </button>
  )
}
