import { cn } from '@/lib/utils'
import { getScoreColor } from '@/types/scoring'

/**
 * Score displayed as a donut ring with the number in the middle.
 * Track is dim, fill traces the score as a fraction of 100, color-graded
 * by `getScoreColor`. Empty scores render a dashed track with an em-dash.
 */

const SIZES = {
  sm: { box: 30, stroke: 2.5, font: 11, r: 12 },
  md: { box: 40, stroke: 3, font: 13, r: 16 },
  lg: { box: 54, stroke: 3.5, font: 16, r: 22 },
} as const

// Colored stroke values — vivid on dark/blue bg, graded by score band.
const STROKE: Record<ReturnType<typeof getScoreColor>, string> = {
  red:          '#F87168',
  orange:       '#F5A25D',
  yellow:       '#E9C75A',
  green:        '#4BCE97',
  'dark-green': '#22A06B',
}

interface Props {
  score: number | null
  size?: keyof typeof SIZES
  className?: string
}

export function ScoreBadge({ score, size = 'md', className }: Props) {
  const { box, stroke, font, r } = SIZES[size]
  const cx = box / 2
  const circumference = 2 * Math.PI * r
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score))
  const dashOffset = circumference * (1 - pct / 100)
  const color = STROKE[getScoreColor(score)]

  return (
    <div
      className={cn('relative inline-flex items-center justify-center shrink-0', className)}
      style={{ width: box, height: box }}
      title={score == null ? 'Нет оценки' : `${score} / 100`}
    >
      <svg width={box} height={box} className="absolute inset-0 -rotate-90" aria-hidden>
        {/* Track */}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-white/10"
          strokeDasharray={score == null ? `2 3` : undefined}
        />
        {/* Progress */}
        {score != null && pct > 0 && (
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 300ms ease' }}
          />
        )}
      </svg>
      <span
        className="relative font-bold tabular-nums leading-none"
        style={{
          color: score == null ? 'var(--muted-foreground)' : color,
          fontSize: font,
        }}
      >
        {score == null ? '–' : score}
      </span>
    </div>
  )
}
