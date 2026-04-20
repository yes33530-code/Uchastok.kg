'use client'

import { useState } from 'react'
import { Phone } from 'lucide-react'

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
        <p className="text-white font-semibold text-sm">Открываем WhatsApp...</p>
        <p className="text-indigo-200 text-xs mt-1">Мы ответим в ближайшее время</p>
        <button
          onClick={() => setSent(false)}
          className="mt-3 text-xs text-indigo-200 underline hover:text-white"
        >
          Отправить снова
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <input
        type="text"
        placeholder="Ваше имя"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        className="w-full text-sm px-3 py-2 rounded-lg bg-indigo-700 border border-indigo-500 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/30"
      />
      <input
        type="tel"
        placeholder="+996 ___  __ __"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        required
        className="w-full text-sm px-3 py-2 rounded-lg bg-indigo-700 border border-indigo-500 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/30"
      />
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 bg-white text-indigo-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-indigo-50 transition-colors"
      >
        <Phone className="w-4 h-4" />
        Перезвоните мне
      </button>
    </form>
  )
}
