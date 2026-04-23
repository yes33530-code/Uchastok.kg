import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Uchastok.kg — Земельные участки в Кыргызстане',
  description: 'Платформа покупки и управления земельными участками в Кыргызстане. Проверенные предложения, юридическая чистота, прозрачная инфраструктура.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geist.variable} h-full`}>
      <body className="h-full font-sans">
        {children}
      </body>
    </html>
  )
}
