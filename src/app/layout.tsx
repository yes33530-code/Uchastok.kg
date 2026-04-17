import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Uchastok.kg',
  description: 'Платформа управления земельными участками',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geist.variable} h-full`}>
      <body className="h-full antialiased font-sans bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  )
}
