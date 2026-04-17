export interface ScoreInputs {
  roi_pct: number | null
  irr_pct: number | null
  location_quality: number | null   // 0–100
  legal_clearance: boolean
  infrastructure_score: number | null  // 0–100
  price_vs_market_pct: number | null   // negative = below market (good)
  buildout_potential: number | null    // 0–100
}

export interface ScoreBreakdown {
  profitability: number  // max 25
  irr: number           // max 15
  location: number      // max 20
  legal: number         // max 15
  infrastructure: number // max 10
  price_vs_market: number // max 10
  buildout: number       // max 5
  total: number          // 0–100
}

export type ScoreColor = 'red' | 'orange' | 'yellow' | 'green' | 'dark-green'

export function getScoreColor(score: number | null): ScoreColor {
  if (score === null) return 'red'
  if (score <= 30) return 'red'
  if (score <= 55) return 'orange'
  if (score <= 70) return 'yellow'
  if (score <= 85) return 'green'
  return 'dark-green'
}
