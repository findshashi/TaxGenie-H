// lib/taxCalculator.js
// Real Indian income tax slab calculations for FY 2025-26 (AY 2026-27).
// Both old and new regime, with standard deduction, 87A rebate, and 4% cess.
// NOTE: these are the slabs as of FY 2025-26. Tax law changes yearly —
// review and update SLABS below each assessment year.

// ── New Regime (default regime since FY 2023-24) ──────────────
const NEW_REGIME_SLABS = [
  { upTo: 400000,   rate: 0 },
  { upTo: 800000,   rate: 0.05 },
  { upTo: 1200000,  rate: 0.10 },
  { upTo: 1600000,  rate: 0.15 },
  { upTo: 2000000,  rate: 0.20 },
  { upTo: 2400000,  rate: 0.25 },
  { upTo: Infinity, rate: 0.30 },
]
const NEW_REGIME_STANDARD_DEDUCTION = 75000
const NEW_REGIME_REBATE_LIMIT       = 1200000 // Sec 87A: full rebate if taxable income <= this
const NEW_REGIME_REBATE_MAX         = 60000

// ── Old Regime ──────────────────────────────────────────────
const OLD_REGIME_SLABS = [
  { upTo: 250000,   rate: 0 },
  { upTo: 500000,   rate: 0.05 },
  { upTo: 1000000,  rate: 0.20 },
  { upTo: Infinity, rate: 0.30 },
]
const OLD_REGIME_STANDARD_DEDUCTION = 50000
const OLD_REGIME_REBATE_LIMIT       = 500000 // Sec 87A
const OLD_REGIME_REBATE_MAX         = 12500

const CESS_RATE = 0.04 // Health & Education Cess, applies to both regimes

/**
 * Apply slab rates to a taxable income amount.
 */
function applySlabs(taxableIncome, slabs) {
  let tax = 0
  let lastThreshold = 0
  for (const slab of slabs) {
    if (taxableIncome > lastThreshold) {
      const amountInSlab = Math.min(taxableIncome, slab.upTo) - lastThreshold
      tax += amountInSlab * slab.rate
      lastThreshold = slab.upTo
    } else {
      break
    }
  }
  return Math.round(tax)
}

/**
 * Calculate tax for the NEW regime.
 * Old-regime-only deductions (80C, 80D, HRA, etc.) are NOT allowed here
 * except a few exceptions (employer NPS 80CCD(2), which we omit for v1 simplicity).
 */
export function calculateNewRegimeTax({ grossIncome }) {
  const taxableIncome = Math.max(0, grossIncome - NEW_REGIME_STANDARD_DEDUCTION)
  let tax = applySlabs(taxableIncome, NEW_REGIME_SLABS)

  // Section 87A rebate — full rebate if taxable income is within limit
  if (taxableIncome <= NEW_REGIME_REBATE_LIMIT) {
    tax = Math.max(0, tax - NEW_REGIME_REBATE_MAX)
    if (taxableIncome <= NEW_REGIME_REBATE_LIMIT) tax = 0 // FY25-26: full rebate up to 12L
  }

  const cess = Math.round(tax * CESS_RATE)
  return {
    regime: 'new',
    standardDeduction: NEW_REGIME_STANDARD_DEDUCTION,
    taxableIncome,
    taxBeforeCess: tax,
    cess,
    totalTax: tax + cess,
  }
}

/**
 * Calculate tax for the OLD regime.
 * Accepts standard Chapter VI-A deductions (80C, 80D, etc.) and HRA exemption.
 */
export function calculateOldRegimeTax({ grossIncome, deductions80C = 0, deductions80D = 0, hraExemption = 0, otherDeductions = 0 }) {
  // Sec 80C is capped at 1.5L by law — enforce here regardless of what's entered
  const cappedDeductions80C = Math.min(deductions80C, 150000)
  const totalDeductions =
    OLD_REGIME_STANDARD_DEDUCTION +
    cappedDeductions80C +
    deductions80D +
    hraExemption +
    otherDeductions

  const taxableIncome = Math.max(0, grossIncome - totalDeductions)
  let tax = applySlabs(taxableIncome, OLD_REGIME_SLABS)

  // Section 87A rebate
  if (taxableIncome <= OLD_REGIME_REBATE_LIMIT) {
    tax = Math.max(0, tax - OLD_REGIME_REBATE_MAX)
  }

  const cess = Math.round(tax * CESS_RATE)
  return {
    regime: 'old',
    standardDeduction: OLD_REGIME_STANDARD_DEDUCTION,
    totalDeductions,
    taxableIncome,
    taxBeforeCess: tax,
    cess,
    totalTax: tax + cess,
  }
}

/**
 * Calculate both regimes and recommend the better one.
 */
export function compareRegimes(input) {
  const newRegime = calculateNewRegimeTax({ grossIncome: input.grossIncome })
  const oldRegime = calculateOldRegimeTax(input)

  const recommended = newRegime.totalTax <= oldRegime.totalTax ? 'new' : 'old'
  const savings = Math.abs(newRegime.totalTax - oldRegime.totalTax)

  return { newRegime, oldRegime, recommended, savings }
}

/**
 * Calculate refund or amount due, given total tax liability and TDS already paid.
 */
export function calculateRefundOrDue(totalTaxLiability, tdsPaid = 0) {
  const diff = tdsPaid - totalTaxLiability
  return {
    refundDue: diff > 0 ? Math.round(diff) : 0,
    taxDue:    diff < 0 ? Math.round(-diff) : 0,
  }
}
