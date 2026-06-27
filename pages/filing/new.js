import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabaseClient'
import { compareRegimes, calculateRefundOrDue } from '../../lib/taxCalculator'

const CURRENT_FY = '2025-26'
const CURRENT_AY = '2026-27'

export default function NewFiling() {
  const router = useRouter()

  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [message, setMessage] = useState(null)

  // ── Form state — core fields only for v1 ──────────────────
  const [salaryIncome, setSalaryIncome]   = useState(0)
  const [otherIncome, setOtherIncome]     = useState(0)
  const [tdsPaid, setTdsPaid]             = useState(0)
  const [deductions80C, setDeductions80C] = useState(0)
  const [deductions80D, setDeductions80D] = useState(0)
  const [hraExemption, setHraExemption]   = useState(0)
  const [regime, setRegime]               = useState('new')
  const [prefillSource, setPrefillSource] = useState(null) // 'form16' | null

  // ── Load session, profile, and pre-fill from Form 16 if available ──
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.replace('/auth/login?redirect=/filing/new')
        return
      }
      setUser(session.user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, pan, phone, city, state')
        .eq('id', session.user.id)
        .single()
      setProfile(profileData)

      // Block filing entirely without a PAN — it's required by law to file
      if (!profileData?.pan) {
        setMessage({
          type: 'error',
          text: 'You need to add your PAN before filing. Redirecting to your profile…',
        })
        setTimeout(() => router.push('/profile?redirect=/filing/new'), 1800)
        return
      }

      // Pre-fill from the most recent Form 16, if one was uploaded
      const { data: form16 } = await supabase
        .from('form16_data')
        .select('gross_salary, tds_deducted, deduction_80c, hra_exemption')
        .eq('user_id', session.user.id)
        .single()

      if (form16) {
        if (form16.gross_salary)  setSalaryIncome(form16.gross_salary)
        if (form16.tds_deducted)  setTdsPaid(form16.tds_deducted)
        if (form16.deduction_80c) setDeductions80C(form16.deduction_80c)
        if (form16.hra_exemption) setHraExemption(form16.hra_exemption)
        setPrefillSource('form16')
      }

      // If 26AS has additional TDS info and Form 16 didn't cover it, use it
      const { data: tax26as } = await supabase
        .from('tax_26as_data')
        .select('total_tds')
        .eq('user_id', session.user.id)
        .single()

      if (tax26as?.total_tds && !form16?.tds_deducted) {
        setTdsPaid(tax26as.total_tds)
      }

      setLoading(false)
    }
    load()
  }, [router])

  // ── Live tax calculation ───────────────────────────────────
  const grossIncome = Number(salaryIncome || 0) + Number(otherIncome || 0)
  const comparison = compareRegimes({
    grossIncome,
    deductions80C: Number(deductions80C || 0),
    deductions80D: Number(deductions80D || 0),
    hraExemption:  Number(hraExemption || 0),
  })
  const activeCalc = regime === 'new' ? comparison.newRegime : comparison.oldRegime
  const { refundDue, taxDue } = calculateRefundOrDue(activeCalc.totalTax, Number(tdsPaid || 0))

  // ── Save as draft filing ───────────────────────────────────
  async function handleSaveDraft() {
    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        user_id: user.id,
        financial_year: CURRENT_FY,
        itr_type: 'ITR-1',
        salary_income: Number(salaryIncome || 0),
        other_income: Number(otherIncome || 0),
        gross_total_income: grossIncome,
        deductions_80c: Number(deductions80C || 0),
        deductions_80d: Number(deductions80D || 0),
        total_deductions: regime === 'old' ? activeCalc.totalDeductions : activeCalc.standardDeduction,
        taxable_income: activeCalc.taxableIncome,
        tax_on_income: activeCalc.taxBeforeCess,
        cess: activeCalc.cess,
        total_tax_liability: activeCalc.totalTax,
        tds_paid: Number(tdsPaid || 0),
        refund_due: refundDue,
        status: 'draft',
      }

      const { data, error } = await supabase
        .from('itr_filings')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      setMessage({ type: 'success', text: 'Draft saved! Redirecting to your dashboard…' })
      setTimeout(() => router.push('/dashboard'), 1200)
    } catch (err) {
      console.error('Save filing error:', err)
      setMessage({ type: 'error', text: 'Could not save your filing. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">

          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-400 hover:text-gray-600 mb-3"
            >
              ← Back to dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Start your ITR filing</h1>
            <p className="text-gray-500 text-sm mt-1">
              AY {CURRENT_AY} (FY {CURRENT_FY}) · PAN: <span className="font-medium text-indigo-600">{profile?.pan}</span>
            </p>
            {prefillSource === 'form16' && (
              <p className="text-xs text-green-600 mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 inline-block">
                ✨ Some fields below were auto-filled from your uploaded Form 16
              </p>
            )}
          </div>

          {message && (
            <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium border
              ${message.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Left: Income & Deductions Form ──────────────── */}
            <div className="lg:col-span-2 space-y-6">

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-bold text-gray-800 mb-4">Income details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      Salary income (gross, from Form 16)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">₹</span>
                      <input
                        type="number"
                        value={salaryIncome}
                        onChange={(e) => setSalaryIncome(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      Other income (interest, dividends, etc.)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">₹</span>
                      <input
                        type="number"
                        value={otherIncome}
                        onChange={(e) => setOtherIncome(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      TDS already deducted (from Form 16 / 26AS)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">₹</span>
                      <input
                        type="number"
                        value={tdsPaid}
                        onChange={(e) => setTdsPaid(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Regime selector ─────────────────────────────── */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800">Tax regime</h2>
                  {comparison.recommended === regime ? (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                      ✓ Best for you
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                      Could save ₹{comparison.savings.toLocaleString('en-IN')} with {comparison.recommended} regime
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRegime('new')}
                    className={`p-4 rounded-lg border-2 text-left transition
                      ${regime === 'new' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <p className="font-semibold text-gray-800">New Regime</p>
                    <p className="text-xs text-gray-500 mt-1">Lower rates, fewer deductions</p>
                    <p className="text-lg font-bold text-indigo-600 mt-2">
                      ₹{comparison.newRegime.totalTax.toLocaleString('en-IN')}
                    </p>
                  </button>
                  <button
                    onClick={() => setRegime('old')}
                    className={`p-4 rounded-lg border-2 text-left transition
                      ${regime === 'old' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <p className="font-semibold text-gray-800">Old Regime</p>
                    <p className="text-xs text-gray-500 mt-1">More deductions available</p>
                    <p className="text-lg font-bold text-indigo-600 mt-2">
                      ₹{comparison.oldRegime.totalTax.toLocaleString('en-IN')}
                    </p>
                  </button>
                </div>
              </div>

              {/* ── Deductions (only relevant for old regime) ───── */}
              {regime === 'old' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-bold text-gray-800 mb-4">Deductions (Old Regime)</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        Section 80C (PF, ELSS, life insurance — max ₹1,50,000)
                      </label>
                      <input
                        type="number"
                        value={deductions80C}
                        onChange={(e) => setDeductions80C(e.target.value)}
                        max={150000}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        Section 80D (health insurance premium)
                      </label>
                      <input
                        type="number"
                        value={deductions80D}
                        onChange={(e) => setDeductions80D(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        HRA exemption
                      </label>
                      <input
                        type="number"
                        value={hraExemption}
                        onChange={(e) => setHraExemption(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Summary ───────────────────────────────── */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                <h2 className="font-bold text-gray-800 mb-4">Computation summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gross income</span>
                    <span className="font-medium">₹{grossIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deductions</span>
                    <span className="font-medium">
                      ₹{(regime === 'old' ? activeCalc.totalDeductions : activeCalc.standardDeduction).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-400">Taxable income</span>
                    <span className="font-medium">₹{activeCalc.taxableIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tax + cess</span>
                    <span className="font-medium">₹{activeCalc.totalTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">TDS already paid</span>
                    <span className="font-medium">₹{Number(tdsPaid || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3 text-base">
                    {refundDue > 0 ? (
                      <>
                        <span className="font-semibold text-green-700">Estimated refund</span>
                        <span className="font-bold text-green-700">₹{refundDue.toLocaleString('en-IN')}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-red-600">Tax due</span>
                        <span className="font-bold text-red-600">₹{taxDue.toLocaleString('en-IN')}</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className={`w-full mt-6 py-3 rounded-lg font-semibold text-sm transition
                    ${saving
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                >
                  {saving ? 'Saving…' : 'Save as draft →'}
                </button>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  This estimate is for ITR-1 (salary income only). You can review and edit before final submission.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
