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
        className="max-w-3xl mx-auto rounded-lg p-5 md:p-6 bg-card ring-1 ring-white/[0.08] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </main>
  )
}
