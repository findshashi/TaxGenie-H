import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react' // or any icon library

export default function Calculator() {
  const [income, setIncome] = useState(1200000)
  const [regime, setRegime] = useState('new') // 'old' or 'new'
  const [showRegimeInfo, setShowRegimeInfo] = useState(false)

  // Dummy calculation logic – replace with your actual logic
  const calculateTax = () => {
    // Simplified example: New regime has standard deduction of 75,000, old has 50,000 + other deductions.
    const stdDeduction = regime === 'new' ? 75000 : 50000
    const otherDeductions = regime === 'old' ? 150000 : 0 // example
    const totalDeductions = stdDeduction + otherDeductions
    const taxable = Math.max(income - totalDeductions, 0)
    // Dummy tax calculation – replace with your slab logic
    const tax = regime === 'old' ? Math.round(taxable * 0.1) : 0 // new regime tax = 0 for demo
    return { taxable, tax, totalDeductions, stdDeduction }
  }

  const { taxable, tax, totalDeductions, stdDeduction } = calculateTax()
  const oldTax = 117000 // from your page
  const newTax = 0
  const youSave = regime === 'old' ? oldTax - tax : newTax - tax // simplified

  return (
    <section id="calculator" className="py-16 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Tax Calculator</h2>
        <p className="text-gray-500 mb-6">Compare Old vs New Regime instantly</p>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="income" className="block text-sm font-medium text-gray-700 mb-1">
              Annual Gross Income (₹)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₹</span>
              <input
                id="income"
                type="number"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 1200000"
              />
            </div>
          </div>
          <div>
            <label htmlFor="regime" className="block text-sm font-medium text-gray-700 mb-1">
              Tax Regime
            </label>
            <select
              id="regime"
              value={regime}
              onChange={(e) => setRegime(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="old">Old Regime</option>
              <option value="new">New Regime</option>
            </select>
          </div>
        </div>

        {/* Regime Info Toggle */}
        <button
          onClick={() => setShowRegimeInfo(!showRegimeInfo)}
          className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          {showRegimeInfo ? 'Hide' : 'Learn more'} about regimes
          {showRegimeInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showRegimeInfo && (
          <div className="mt-2 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
            <p><strong>Old Regime:</strong> Allows deductions (80C, 80D, etc.) but has higher tax rates.</p>
            <p><strong>New Regime:</strong> Lower tax rates but fewer deductions. Standard deduction of ₹75,000 available.</p>
          </div>
        )}

        {/* Results */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Old Regime</h4>
            <p className="text-2xl font-bold text-gray-800">₹ {oldTax.toLocaleString()}</p>
            <div className="text-xs text-gray-400 mt-1">
              Std Deduction: ₹50,000 | Total Deductions: ₹2,00,000
            </div>
          </div>
          <div className={`bg-gray-50 p-4 rounded-lg ${tax === 0 ? 'border-2 border-green-500' : ''}`}>
            <h4 className="text-sm font-medium text-gray-500">New Regime</h4>
            <p className="text-2xl font-bold text-gray-800">₹ {tax.toLocaleString()}</p>
            <div className="text-xs text-gray-400 mt-1">
              Std Deduction: ₹75,000 | Total Deductions: ₹75,000
            </div>
          </div>
        </div>

        {/* Savings Highlight */}
        {youSave > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <span className="text-green-600 text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">You Save ₹{youSave.toLocaleString()}</p>
              <p className="text-sm text-green-700">Best Regime for You: <strong>{regime === 'old' ? 'Old' : 'New'} Regime</strong></p>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 mt-4 border-t pt-4">
          * This calculator provides an estimate only. Actual tax liability may vary based on your specific income sources and deductions.
        </p>

        {/* Primary CTA */}
        <div className="mt-8 text-center">
          <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition duration-200">
            File Your ITR Now – Start for Free
          </button>
        </div>
      </div>
    </section>
  )
}
