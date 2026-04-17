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
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
        published
          ? 'text-emerald-400 hover:bg-emerald-500/10'
          : 'text-white/60 hover:text-white/90 hover:bg-white/5'
      }`}
      style={{ border: `1px solid ${published ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.1)'}` }}
    >
      {published ? <Globe className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      {published ? 'Опубликовано' : 'Опубликовать'}
    </button>
  )
}
