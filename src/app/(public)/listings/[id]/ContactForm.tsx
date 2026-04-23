'use client'

import { useState } from 'react'
import { Phone, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function ContactForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = encodeURIComponent(`Здравствуйте! Меня зовут ${name}, мой номер: ${phone}. Хочу узнать подробнее об участке.`)
    window.open(`https://wa.me/996997902903?text=${text}`, '_blank')
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10">
          <Check className="size-5 text-primary" />
        </div>
        <p className="font-semibold text-sm text-foreground">Открываем WhatsApp…</p>
        <p className="mt-1 text-xs text-muted-foreground">Мы ответим в ближайшее время</p>
        <button
          onClick={() => setSent(false)}
          className="mt-3 text-xs text-primary hover:underline"
        >
          Отправить снова
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <Input
        type="text"
        placeholder="Ваше имя"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <Input
        type="tel"
        placeholder="+996 ___  __ __"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        required
      />
      <Button type="submit" className="w-full" size="lg">
        <Phone className="size-4" />
        Перезвоните мне
      </Button>
    </form>
  )
}
