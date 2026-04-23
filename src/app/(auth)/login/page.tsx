import { LoginForm } from '@/components/auth/login-form'

export const metadata = { title: 'Войти — Uchastok.kg' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">У</span>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              Uchastok<span className="text-primary">.kg</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Управление земельными участками</p>
        </div>
        <div className="bg-card rounded-lg border border-border shadow-sm p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
