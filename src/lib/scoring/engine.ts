import type { ScoreInputs, ScoreBreakdown } from '@/types/scoring'

function lerp(x: number, x0: number, x1: number, y0: number, y1: number): number {
  return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0)
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/**
 * Pure scoring function — no DB calls, fully testable.
 * Weights: ROI 25, IRR 15, Location 20, Legal 15, Infra 10, Price 10, Buildout 5
 */
export function calculateScore(inputs: ScoreInputs): ScoreBreakdown {
  // ── Profitability (ROI) — max 25 ─────────────────────────────
  // ≥40% → 25pts | 20–40% → linear 12.5–25 | 0–20% → linear 0–12.5 | <0 → 0
  const profitability = inputs.roi_pct === null
    ? 0
    : clamp(
        inputs.roi_pct >= 40 ? 25
        : inputs.roi_pct >= 20 ? lerp(inputs.roi_pct, 20, 40, 12.5, 25)
        : inputs.roi_pct >= 0  ? lerp(inputs.roi_pct, 0, 20, 0, 12.5)
        : 0,
        0, 25
      )

  // ── IRR — max 15 ─────────────────────────────────────────────
  // ≥25% → 15pts | 15–25% → linear 7.5–15 | 0–15% → linear 0–7.5 | <0 → 0
  const irr = inputs.irr_pct === null
    ? 0
    : clamp(
        inputs.irr_pct >= 25 ? 15
        : inputs.irr_pct >= 15 ? lerp(inputs.irr_pct, 15, 25, 7.5, 15)
        : inputs.irr_pct >= 0  ? lerp(inputs.irr_pct, 0, 15, 0, 7.5)
        : 0,
        0, 15
      )

  // ── Location Quality — max 20 ─────────────────────────────────
  // Direct 0–100 input, scaled to 0–20
  const location = inputs.location_quality === null
    ? 0
    : clamp((inputs.location_quality / 100) * 20, 0, 20)

  // ── Legal Clearance — max 15 ─────────────────────────────────
  // Red Book (legal_clearance = true) → 15pts; Green Book → 0pts
  const legal = inputs.legal_clearance ? 15 : 0

  // ── Infrastructure — max 10 ──────────────────────────────────
  const infrastructure = inputs.infrastructure_score === null
    ? 0
    : clamp((inputs.infrastructure_score / 100) * 10, 0, 10)

  // ── Price vs Market — max 10 ─────────────────────────────────
  // price_vs_market_pct: negative = below market (good)
  // ≤ -20% → 10pts | 0% → 5pts | ≥ +20% → 0pts (linear between)
  const price_vs_market = inputs.price_vs_market_pct === null
    ? 5  // neutral when not set
    : clamp(
        inputs.price_vs_market_pct <= -20 ? 10
        : inputs.price_vs_market_pct <= 0  ? lerp(inputs.price_vs_market_pct, -20, 0, 10, 5)
        : inputs.price_vs_market_pct <= 20 ? lerp(inputs.price_vs_market_pct, 0, 20, 5, 0)
        : 0,
        0, 10
      )

  // ── Buildout Potential — max 5 ───────────────────────────────
  const buildout = inputs.buildout_potential === null
    ? 0
    : clamp((inputs.buildout_potential / 100) * 5, 0, 5)

  const total = Math.round(
    profitability + irr + location + legal + infrastructure + price_vs_market + buildout
  )

  return {
    profitability,
    irr,
    location,
    legal,
    infrastructure,
    price_vs_market,
    buildout,
    total: clamp(total, 0, 100),
  }
}
