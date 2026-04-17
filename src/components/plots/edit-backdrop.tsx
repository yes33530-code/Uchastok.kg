'use client'
import { useRouter } from 'next/navigation'

export function EditBackdrop({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <main
      className="flex-1 overflow-y-auto p-3 md:p-6 cursor-default"
      onClick={() => router.back()}
    >
      <div
        className="max-w-3xl mx-auto rounded-xl p-5 md:p-6"
        style={{ backgroundColor: '#142a50', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </main>
  )
}
