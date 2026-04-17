import type { CalcInputs, CalcOutputs } from '@/types/calculator'

/**
 * Pure profit calculation function — synchronous, no side effects.
 * Called on every input change in the calculator hook.
 */
export function calculate(i: CalcInputs): CalcOutputs {
  const ownerShareDeductionSqm = i.total_buildable_area_sqm * (i.owner_share_pct / 100)
  const effectiveSellableAreaSqm = i.total_buildable_area_sqm - ownerShareDeductionSqm

  const constructionTotal = i.construction_cost_per_sqm * i.total_buildable_area_sqm
  const baseCost = i.land_acquisition_cost + constructionTotal
  const contingencyAmount = baseCost * (i.contingency_pct / 100)

  // Simple interest on (base + contingency) for project duration
  const durationYears = i.project_duration_months / 12
  const financingCost = (baseCost + contingencyAmount) * (i.financing_rate_pct / 100) * durationYears

  const totalDevelopmentCost = baseCost + contingencyAmount + financingCost
  const totalProjectedRevenue = effectiveSellableAreaSqm * i.avg_sale_price_per_sqm

  const grossProfit = totalProjectedRevenue - totalDevelopmentCost
  const netProfit = grossProfit * (1 - i.tax_rate_pct / 100)

  const roiPct = totalDevelopmentCost > 0
    ? (netProfit / totalDevelopmentCost) * 100
    : 0

  // IRR: (net_revenue / cost)^(1/years) − 1, expressed as %
  const netRevenue = totalProjectedRevenue * (1 - i.tax_rate_pct / 100)
  const irrPct = approximateIRR(totalDevelopmentCost, netRevenue, durationYears)

  const breakevenPricePerSqm = effectiveSellableAreaSqm > 0
    ? totalDevelopmentCost / effectiveSellableAreaSqm
    : 0

  const annualizedReturnPct = i.project_duration_months > 0
    ? (roiPct / i.project_duration_months) * 12
    : 0

  return {
    owner_share_deduction_sqm: round(ownerShareDeductionSqm),
    effective_sellable_area_sqm: round(effectiveSellableAreaSqm),
    construction_total: round(constructionTotal),
    financing_cost: round(financingCost),
    contingency_amount: round(contingencyAmount),
    total_development_cost: round(totalDevelopmentCost),
    total_projected_revenue: round(totalProjectedRevenue),
    gross_profit: round(grossProfit),
    net_profit: round(netProfit),
    roi_pct: round(roiPct, 2),
    irr_pct: round(irrPct, 2),
    breakeven_price_per_sqm: round(breakevenPricePerSqm),
    annualized_return_pct: round(annualizedReturnPct, 2),
  }
}

function approximateIRR(cost: number, revenue: number, years: number): number {
  if (cost <= 0 || revenue <= 0 || years <= 0) return 0
  return (Math.pow(revenue / cost, 1 / years) - 1) * 100
}

function round(value: number, decimals = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}
