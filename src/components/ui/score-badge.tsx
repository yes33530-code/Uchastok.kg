import { cn } from '@/lib/utils'
import { getScoreColor } from '@/types/scoring'

const colorMap = {
  red: 'bg-red-100 text-red-700 border-red-300',
  orange: 'bg-orange-100 text-orange-700 border-orange-300',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  green: 'bg-green-100 text-green-700 border-green-300',
  'dark-green': 'bg-emerald-100 text-emerald-800 border-emerald-400',
}

interface ScoreBadgeProps {
  score: number | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ScoreBadge({ score, size = 'md', className }: ScoreBadgeProps) {
  const color = getScoreColor(score)

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-full border',
        size === 'sm' && 'text-xs px-2 py-0.5 min-w-[2rem]',
        size === 'md' && 'text-sm px-2.5 py-1 min-w-[2.5rem]',
        size === 'lg' && 'text-base px-3 py-1.5 min-w-[3rem]',
        colorMap[color],
        className
      )}
    >
      {score === null ? '–' : score}
    </span>
  )
}
