import Link from 'next/link'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/listings" className="text-indigo-700 font-bold text-lg tracking-tight">
            Uchastok.kg
          </Link>
          <a
            href="tel:+996700000000"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Связаться с нами
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Uchastok.kg — все права защищены
        </div>
      </footer>
    </div>
  )
}
