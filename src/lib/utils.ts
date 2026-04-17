import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUSD(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(value)
}

export function formatPct(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(decimals)}%`
}

export function formatSotok(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${formatNumber(value)} сот.`
}

export function formatSqm(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${formatNumber(value, 0)} м²`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function daysAgo(dateStr: string | null | undefined): number {
  if (!dateStr) return 0
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
