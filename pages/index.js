import Layout from '../components/Layout'
import { useState, useEffect } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

// DocumentUploader is removed from the public page – it's now on the dashboard only
import WhyChoose from '../components/WhyChoose'
import Testimonials from '../components/Testimonials'
import FAQ from '../components/FAQ'
import FilingStatus from '../components/FilingStatus'

// ... inside the return, after "How it Works" section:

{/* ── Filing Status Steps ── */}
<FilingStatus />

export default function Home() {
  const [tab, setTab] = useState('simple')
  const [ageGroup, setAgeGroup] = useState('below60')
  const [grossIncome, setGrossIncome] = useState(1200000)
  const [deductions, setDeductions] = useState(150000)
  const [detSalary, setDetSalary] = useState(0)
  const [detBusiness, setDetBusiness] = useState(0)
  const [detHouse, setDetHouse] = useState(0)
  const [detOther, setDetOther] = useState(0)
  const [det80c, setDet80c] = useState(0)
  const [det80d, setDet80d] = useState(0)
  const [detHRA, setDetHRA] = useState(0)
  const [detHomeLoan, setDetHomeLoan] = useState(0)
  const [results, setResults] = useState({ oldTax: 0, newTax: 0, oldTaxable: 0, newTaxable: 0, totalDeductionsOld: 0 })

  const formatCurrency = (amount) => '₹ ' + Math.round(amount).toLocaleString('en-IN')

  const calculateSurcharge = (tax, income) => {
    if (income > 20000000) return tax * 0.25
    if (income > 10000000) return tax * 0.15
    if (income > 5000000) return tax * 0.10
    return 0
  }

  const calculateOldTax = (taxableIncome, age) => {
    let tax = 0
    if (age === 'above80') {
      if (taxableIncome <= 500000) tax = 0
      else if (taxableIncome <= 1000000) tax = (taxableIncome - 500000) * 0.20
      else tax = 100000 + (taxableIncome - 1000000) * 0.30
    } else if (age === 'above60') {
      if (taxableIncome <= 300000) tax = 0
      else if (taxableIncome <= 500000) tax = (taxableIncome - 300000) * 0.05
      else if (taxableIncome <= 1000000) tax = 10000 + (taxableIncome - 500000) * 0.20
      else tax = 110000 + (taxableIncome - 1000000) * 0.30
    } else {
      if (taxableIncome <= 250000) tax = 0
      else if (taxableIncome <= 500000) tax = (taxableIncome - 250000) * 0.05
      else if (taxableIncome <= 1000000) tax = 12500 + (taxableIncome - 500000) * 0.20
      else tax = 112500 + (taxableIncome - 1000000) * 0.30
    }
    if (taxableIncome <= 500000) tax = 0
    const surcharge = calculateSurcharge(tax, taxableIncome)
    const cess = (tax + surcharge) * 0.04
    return Math.round(tax + surcharge + cess)
  }

  const calculateNewTax = (taxableIncome) => {
    let remaining = taxableIncome
    let tax = 0
    const slabs = [
      { limit: 400000, rate: 0 },
      { limit: 800000, rate: 0.05 },
      { limit: 1200000, rate: 0.10 },
      { limit: 1600000, rate: 0.15 },
      { limit: 2000000, rate: 0.20 },
      { limit: 2400000, rate: 0.25 },
      { limit: Infinity, rate: 0.30 }
    ]
    let prevLimit = 0
    for (const slab of slabs) {
      if (remaining > 0) {
        const taxableInSlab = Math.min(remaining, slab.limit - prevLimit)
        tax += taxableInSlab * slab.rate
        remaining -= taxableInSlab
        prevLimit = slab.limit
      }
    }
    if (taxableIncome <= 1200000) tax = 0
    const surcharge = calculateSurcharge(tax, taxableIncome)
    const cess = (tax + surcharge) * 0.04
    return Math.round(tax + surcharge + cess)
  }

  const updateResults = () => {
    let gross = 0, totalOldDed = 0, taxableIncomeOld = 0, taxableIncomeNew = 0
    if (tab === 'simple') {
      gross = grossIncome
      const totalDed = Math.min(deductions, gross) + 50000
      totalOldDed = totalDed
      taxableIncomeOld = Math.max(0, gross - totalDed)
      taxableIncomeNew = Math.max(0, gross - 75000)
    } else {
      gross = detSalary + detBusiness + detHouse + detOther
      const d80c = Math.min(det80c, 150000)
      const d80d = Math.min(det80d, ageGroup !== 'below60' ? 50000 : 25000)
      const hra = Math.min(detHRA, detSalary)
      const homeLoan = Math.min(detHomeLoan, 200000)
      totalOldDed = d80c + d80d + hra + homeLoan + 50000
      taxableIncomeOld = Math.max(0, gross - totalOldDed)
      taxableIncomeNew = Math.max(0, gross - 75000)
    }
    setResults({
      oldTax: calculateOldTax(taxableIncomeOld, ageGroup),
      newTax: calculateNewTax(taxableIncomeNew),
      oldTaxable: taxableIncomeOld,
      newTaxable: taxableIncomeNew,
      totalDeductionsOld: totalOldDed
    })
  }

  useEffect(() => {
    updateResults()
  }, [tab, ageGroup, grossIncome, deductions, detSalary, detBusiness, detHouse, detOther, det80c, det80d, detHRA, detHomeLoan])

  const saving = Math.abs(results.oldTax - results.newTax)
  const betterRegime = results.oldTax < results.newTax ? 'Old Regime' : 'New Regime'
  const showSaving = saving > 0 && (tab === 'simple' ? grossIncome > 0 : true)

  return (
    <Layout>

      {/* ── Hero Section ── */}
      <section className="bg-gradient-to-br from-gray-900 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 lg:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-white/20 rounded-full px-4 py-1.5 text-sm backdrop-blur-sm mb-5">
                <i className="fas fa-shield-alt mr-2 text-yellow-300"></i>
                <span>#1 ITR Filing Platform</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                File Your Income Tax Return in <span className="text-yellow-300">Minutes</span>
              </h1>
              <p className="text-lg text-gray-100 mt-5 max-w-lg">
                Expert-assisted ITR filing with maximum refund guarantee. Start with our free tax calculator.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <a href="/auth/signup" className="bg-white text-indigo-700 px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-gray-100 transition flex items-center">
                  <i className="fas fa-user-plus mr-2"></i> Get Started
                </a>
                <a href="#pricing" className="border border-white/40 px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                  <i className="fas fa-tag mr-2"></i> View Pricing
                </a>
                {/* ── NEW: ADMIN LOGIN BUTTON ── */}
                <a href="/admin/login" className="border border-yellow-400/60 text-yellow-300 hover:bg-yellow-400/10 px-6 py-3 rounded-lg font-semibold transition flex items-center">
                  <i className="fas fa-user-shield mr-2"></i> Admin Login
                </a>
              </div>
            </div>

            {/* ── Tax Calculator Widget ── */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 shadow-xl border border-white/20">
              <div className="flex items-center gap-3 mb-4 border-b border-white/20 pb-2">
                <div className="bg-yellow-400 rounded-lg w-8 h-8 flex items-center justify-center">
                  <i className="fas fa-calculator text-indigo-900 text-sm"></i>
                </div>
                <div>
                  <div className="text-white font-medium">Tax Calculator</div>
                  <div className="text-indigo-200 text-xs">Compare Old vs New Regime</div>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setTab('simple')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === 'simple' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-indigo-200 hover:bg-white/20'}`}
                >
                  Quick
                </button>
                <button
                  onClick={() => setTab('detailed')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === 'detailed' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-indigo-200 hover:bg-white/20'}`}
                >
                  Detailed
                </button>
              </div>

              {tab === 'simple' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-indigo-200 text-sm mb-1">Age Group</label>
                    <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-400">
                      <option value="below60">Below 60</option>
                      <option value="above60">Senior Citizen (60-80)</option>
                      <option value="above80">Super Senior (80+)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-indigo-200 text-sm mb-1">Annual Gross Income (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300">₹</span>
                      <input type="number" value={grossIncome} onChange={(e) => setGrossIncome(Number(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-indigo-200 text-sm mb-1">
                      Deductions (80C, 80D, etc.)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300">₹</span>
                      <input type="number" value={deductions} onChange={(e) => setDeductions(Number(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-400" />
                    </div>
                  </div>
                </div>
              )}

              {tab === 'detailed' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Salary income', val: detSalary, set: setDetSalary },
                      { label: 'Business income', val: detBusiness, set: setDetBusiness },
                      { label: 'House property', val: detHouse, set: setDetHouse },
                      { label: 'Other income', val: detOther, set: setDetOther },
                    ].map(({ label, val, set }) => (
                      <div key={label}>
                        <label className="block text-indigo-200 text-xs mb-1">{label}</label>
                        <input type="number" value={val} onChange={(e) => set(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" />
                      </div>
                    ))}
                  </div>
                  <hr className="border-white/20" />
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: '80C (max ₹1.5L)', val: det80c, set: setDet80c },
                      { label: '80D health insurance', val: det80d, set: setDet80d },
                      { label: 'HRA exemption', val: detHRA, set: setDetHRA },
                      { label: 'Home loan interest', val: detHomeLoan, set: setDetHomeLoan },
                    ].map(({ label, val, set }) => (
                      <div key={label}>
                        <label className="block text-indigo-200 text-xs mb-1">{label}</label>
                        <input type="number" value={val} onChange={(e) => set(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <hr className="border-white/20 my-4" />

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`bg-white/10 rounded-xl p-3 text-center transition ${results.oldTax < results.newTax ? 'ring-2 ring-yellow-400' : ''}`}>
                  <div className="text-indigo-200 text-xs">Old Regime</div>
                  <div className="text-white text-xl font-bold">{formatCurrency(results.oldTax)}</div>
                  {results.oldTax < results.newTax && <div className="text-yellow-300 text-xs mt-1">Best for you</div>}
                </div>
                <div className={`bg-white/10 rounded-xl p-3 text-center transition ${results.newTax < results.oldTax ? 'ring-2 ring-yellow-400' : ''}`}>
                  <div className="text-indigo-200 text-xs">New Regime</div>
                  <div className="text-white text-xl font-bold">{formatCurrency(results.newTax)}</div>
                  {results.newTax < results.oldTax && <div className="text-yellow-300 text-xs mt-1">Best for you</div>}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-indigo-300">Particulars</span>
                  <span className="text-indigo-300">Old</span>
                  <span className="text-indigo-300">New</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Income</span>
                  <span>{formatCurrency(tab === 'simple' ? grossIncome : (detSalary+detBusiness+detHouse+detOther))}</span>
                  <span>{formatCurrency(tab === 'simple' ? grossIncome : (detSalary+detBusiness+detHouse+detOther))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Std Deduction</span>
                  <span>₹ 50,000</span>
                  <span>₹ 75,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Deductions</span>
                  <span>{formatCurrency(results.totalDeductionsOld)}</span>
                  <span>₹ 75,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxable Income</span>
                  <span>{formatCurrency(results.oldTaxable)}</span>
                  <span>{formatCurrency(results.newTaxable)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1 border-t border-white/20">
                  <span>Tax Payable</span>
                  <span className="text-yellow-300">{formatCurrency(results.oldTax)}</span>
                  <span className="text-yellow-300">{formatCurrency(results.newTax)}</span>
                </div>
              </div>

              {showSaving && saving > 0 && (
                <div className="mt-3 bg-indigo-800/50 rounded-lg p-2 flex justify-between items-center">
                  <span className="text-indigo-200 text-xs">You save with {betterRegime}</span>
                  <span className="text-green-300 text-sm font-bold">{formatCurrency(saving)}</span>
                </div>
              )}
              <div className="text-indigo-300 text-xs text-center mt-3">* This calculator provides an estimate only.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose ITRGenie ── */}
      <WhyChoose />

      {/* ── Pricing Section ── */}
      <div id="pricing" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">Pricing Plans</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">Choose the Plan That Fits You</h2>
          <p className="text-gray-500 mt-4">From self-filing to expert-assisted, we have a plan for everyone.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800">Self Filing</h3>
            <div className="mt-2"><span className="text-4xl font-black">₹499</span><span className="text-gray-500"> + GST</span></div>
            <p className="text-sm text-gray-500 mt-1">Do-it-yourself with smart guidance</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Step-by-step e-filing</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Automated income import</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Real-time error check</li>
            </ul>
            <a href="/auth/signup?plan=self-itr"><button className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700">Buy Now</button></a>
          </div>

          <div className="bg-white rounded-2xl shadow-md border-2 border-indigo-200 p-6 relative">
            <span className="absolute -top-3 left-6 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">Most popular</span>
            <h3 className="text-xl font-bold text-gray-800">Expert Assisted</h3>
            <div className="mt-2"><span className="text-4xl font-black">₹1,499</span><span className="text-gray-500"> + GST</span></div>
            <p className="text-sm text-gray-500 mt-1">Tax pro review + filing support</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Dedicated tax expert</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Form 16 & AIS analysis</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> 48h filing turnaround</li>
            </ul>
            <a href="/auth/signup?plan=expert-assisted"><button className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700">Buy Now</button></a>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800">CA Assisted</h3>
            <div className="mt-2"><span className="text-4xl font-black">₹2,499</span><span className="text-gray-500"> + GST</span></div>
            <p className="text-sm text-gray-500 mt-1">Complete CA-managed filing</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> CA review & compliance</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Capital gains & crypto</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Priority query resolution</li>
            </ul>
            <a href="/auth/signup?plan=ca-assisted"><button className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700">Buy Now</button></a>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800">Live with Expert</h3>
            <div className="mt-2"><span className="text-4xl font-black">₹2,999</span><span className="text-gray-500"> + GST</span></div>
            <p className="text-sm text-gray-500 mt-1">Real-time screen share + filing</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> 1-on-1 live session</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Same-day finalisation</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> All CA Assisted features</li>
            </ul>
            <a href="/auth/signup?plan=live-expert"><button className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700">Buy Now</button></a>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-2"><i className="fas fa-star text-yellow-500"></i><span className="text-xs font-semibold text-gray-600">⭐ Global Wealth Builder</span></div>
            <h3 className="text-xl font-bold text-gray-800">HNI Global</h3>
            <div className="mt-2"><span className="text-4xl font-black">₹4,999</span><span className="text-gray-500 line-through ml-2">₹9,999</span><span className="text-green-600 text-sm ml-2">-50%</span></div>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> ESOPs & RSU gains</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> US Stocks & foreign income</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Strategic tax advisory</li>
            </ul>
            <a href="/auth/signup?plan=hni-global"><button className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700">Buy Now</button></a>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800">Enterprise</h3>
            <div className="mt-2"><span className="text-4xl font-black">Custom</span></div>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Bulk filing support</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Dedicated account manager</li>
              <li className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> API integration</li>
            </ul>
            <a href="/auth/signup?plan=enterprise"><button className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700">Contact Sales</button></a>
          </div>
        </div>

        <div className="mt-12 bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-md border border-indigo-100 p-6 flex flex-col justify-center items-center text-center">
          <i className="fas fa-question-circle text-4xl text-indigo-500 mb-3"></i>
          <h3 className="text-xl font-bold text-gray-800">Confused Which Plan to Choose?</h3>
          <p className="text-gray-600 text-sm mt-2">Talk to our expert for a free consultation.</p>
          <button className="mt-5 bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700">Talk to Expert</button>
        </div>
      </div>

      {/* ── Testimonials ── */}
      <Testimonials />

      {/* ── Live with Expert Section ── */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl overflow-hidden shadow-2xl">
          <div className="relative z-10 grid md:grid-cols-2 gap-8 p-8 md:p-12">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span>Live Expert Session</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">File Your ITR Live with an Expert</h2>
              <p className="text-indigo-100 mb-6">Get 1-on-1 screen share assistance and file your return in under 60 minutes.</p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3"><i className="fas fa-check-circle text-yellow-300"></i><span>Live Screen Share</span></div>
                <div className="flex items-center gap-3"><i className="fas fa-check-circle text-yellow-300"></i><span>60-Minute Session</span></div>
                <div className="flex items-center gap-3"><i className="fas fa-check-circle text-yellow-300"></i><span>100% Secure</span></div>
              </div>
              <a href="/auth/signup?plan=live-expert">
                <button className="bg-white text-indigo-700 px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-100 transition">Book Live Session</button>
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4 text-center"><i className="fas fa-video text-3xl text-yellow-300 mb-2"></i><p className="text-white font-semibold">Live Screen Share</p></div>
              <div className="bg-white/10 rounded-xl p-4 text-center"><i className="fas fa-clock text-3xl text-yellow-300 mb-2"></i><p className="text-white font-semibold">60-Minute Session</p></div>
              <div className="bg-white/10 rounded-xl p-4 text-center"><i className="fas fa-shield-alt text-3xl text-yellow-300 mb-2"></i><p className="text-white font-semibold">100% Secure</p></div>
              <div className="bg-white/10 rounded-xl p-4 text-center"><i className="fas fa-file-pdf text-3xl text-yellow-300 mb-2"></i><p className="text-white font-semibold">Instant Download</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── How it Works Section ── */}
      <div id="how-it-works" className="bg-gray-50 py-16 border-t">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">How ITRGenie Works</h2>
          <div className="grid md:grid-cols-4 gap-6 mt-10">
            <div><i className="fas fa-user-plus text-3xl text-indigo-500"></i><h4 className="font-bold mt-2">Create Account</h4></div>
            <div><i className="fas fa-id-card text-3xl text-indigo-500"></i><h4 className="font-bold mt-2">Enter Your Details</h4></div>
            <div><i className="fas fa-file-alt text-3xl text-indigo-500"></i><h4 className="font-bold mt-2">Review & Confirm</h4></div>
            <div><i className="fas fa-credit-card text-3xl text-indigo-500"></i><h4 className="font-bold mt-2">Pay & E-File</h4></div>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <FAQ />

    </Layout>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common']))
    }
  }
}
