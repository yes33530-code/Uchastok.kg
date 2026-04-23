import Link from 'next/link'
import { Phone } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-background/75 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/listings" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">У</span>
            <span className="font-semibold text-base tracking-tight text-foreground">
              Uchastok<span className="text-primary">.kg</span>
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href="tel:+996997902903"
              className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'hidden sm:inline-flex' })}
            >
              <Phone className="size-4" />
              +996 997 902 903
            </a>

            <a
              href="tel:+996997902903"
              aria-label="Позвонить"
              className={buttonVariants({ variant: 'default', size: 'icon-sm', className: 'sm:hidden' })}
            >
              <Phone className="size-4" />
            </a>

            <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Войти
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">У</span>
              <span className="font-semibold text-foreground">Uchastok<span className="text-primary">.kg</span></span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Проверенные земельные участки в Кыргызстане. Юридическая чистота и прозрачная инфраструктура.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-3">Контакты</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="tel:+996997902903" className="hover:text-foreground transition-colors">
                  +996 997 902 903
                </a>
              </li>
              <li>
                <a href="https://wa.me/996997902903" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-3">Платформа</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/listings" className="hover:text-foreground transition-colors">Каталог участков</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">Войти</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Uchastok.kg — все права защищены
          </div>
        </div>
      </footer>
    </div>
  )
}
