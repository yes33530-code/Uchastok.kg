export interface CalcInputs {
  land_acquisition_cost: number
  construction_cost_per_sqm: number
  total_buildable_area_sqm: number
  owner_share_pct: number        // 0–100
  avg_sale_price_per_sqm: number
  financing_rate_pct: number     // annual %
  tax_rate_pct: number           // %
  contingency_pct: number        // % of (land + construction)
  project_duration_months: number
}

export interface CalcOutputs {
  owner_share_deduction_sqm: number
  effective_sellable_area_sqm: number
  construction_total: number
  financing_cost: number
  contingency_amount: number
  total_development_cost: number
  total_projected_revenue: number
  gross_profit: number
  net_profit: number
  roi_pct: number
  irr_pct: number
  breakeven_price_per_sqm: number
  annualized_return_pct: number
}

export const DEFAULT_CALC_INPUTS: CalcInputs = {
  land_acquisition_cost: 0,
  construction_cost_per_sqm: 0,
  total_buildable_area_sqm: 0,
  owner_share_pct: 0,
  avg_sale_price_per_sqm: 0,
  financing_rate_pct: 0,
  tax_rate_pct: 0,
  contingency_pct: 0,
  project_duration_months: 12,
}
