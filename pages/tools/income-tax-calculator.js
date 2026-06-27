import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

// ============================================
// TAX CALCULATION FUNCTIONS
// ============================================

function calculateSurcharge(tax, income) {
  if (income > 20000000) return tax * 0.25;
  if (income > 10000000) return tax * 0.15;
  if (income > 5000000)  return tax * 0.10;
  return 0;
}

function calculateOldRegimeTax(income, age = "below60") {
  let tax = 0;
  if (age === "above80") {
    if (income <= 500000)  tax = 0;
    else if (income <= 1000000) tax = (income - 500000) * 0.20;
    else tax = 100000 + (income - 1000000) * 0.30;
  } else if (age === "above60") {
    if (income <= 300000)  tax = 0;
    else if (income <= 500000)  tax = (income - 300000) * 0.05;
    else if (income <= 1000000) tax = 10000 + (income - 500000) * 0.20;
    else tax = 110000 + (income - 1000000) * 0.30;
  } else {
    if (income <= 250000)  tax = 0;
    else if (income <= 500000)  tax = (income - 250000) * 0.05;
    else if (income <= 1000000) tax = 12500 + (income - 500000) * 0.20;
    else tax = 112500 + (income - 1000000) * 0.30;
  }
  if (income <= 500000) tax = 0;
  tax += calculateSurcharge(tax, income);
  tax += tax * 0.04;
  return Math.round(tax);
}

function calculateNewRegimeTax(income) {
  const slabs = [
    [400000, 0], [800000, 0.05], [1200000, 0.10],
    [1600000, 0.15], [2000000, 0.20], [2400000, 0.25],
    [Infinity, 0.30],
  ];
  let tax = 0, prev = 0;
  for (const [limit, rate] of slabs) {
    if (income > prev) {
      tax += (Math.min(income, limit) - prev) * rate;
      prev = limit;
    }
  }
  if (income <= 1200000) tax = 0;
  tax += calculateSurcharge(tax, income);
  tax += tax * 0.04;
  return Math.round(tax);
}

function formatCurrency(value) {
  return "₹ " + Math.round(value).toLocaleString("en-IN");
}

function safeVal(val) {
  return Math.max(0, parseFloat(val) || 0);
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function IncomeTaxCalculator() {
  const [activeTab, setActiveTab] = useState("quick");
  const [form, setForm] = useState({
    ageGroup: "below60",
    grossIncome: 1200000,
    deductions: 150000,
    salary: 0,
    business: 0,
    house: 0,
    other: 0,
    d80c: 0,
    d80d: 0,
    hra: 0,
    home: 0,
  });
  const [result, setResult] = useState(null);

  function set(key) {
    return (val) => setForm((prev) => ({ ...prev, [key]: val }));
  }

  const handleIncomeSlider = (e) => {
    set("grossIncome")(parseInt(e.target.value));
  };

  useEffect(() => {
    let normalIncome, totalOldDed;

    if (activeTab === "quick") {
      normalIncome = safeVal(form.grossIncome);
      const userDed = Math.min(safeVal(form.deductions), normalIncome);
      totalOldDed = userDed + 50000;
    } else {
      const salary = safeVal(form.salary);
      normalIncome = salary + safeVal(form.business) + safeVal(form.house) + safeVal(form.other);
      const d80c = Math.min(safeVal(form.d80c), 150000);
      const d80d = Math.min(safeVal(form.d80d), form.ageGroup !== "below60" ? 50000 : 25000);
      const hra  = Math.min(safeVal(form.hra), salary);
      const home = Math.min(safeVal(form.home), 200000);
      totalOldDed = d80c + d80d + hra + home + 50000;
    }

    const tiOld = Math.max(0, normalIncome - totalOldDed);
    const tiNew = Math.max(0, normalIncome - 75000);
    const oldTax = calculateOldRegimeTax(tiOld, form.ageGroup);
    const newTax = calculateNewRegimeTax(tiNew);

    setResult({
      grossIncome: normalIncome,
      totalOldDed,
      tiOld, tiNew,
      oldTax, newTax,
      saving: Math.abs(oldTax - newTax),
      betterRegime: oldTax <= newTax ? "Old Regime" : "New Regime",
    });
  }, [form, activeTab]);

  const isNewBetter = result?.newTax < result?.oldTax;
  const isOldBetter = result?.oldTax < result?.newTax;
  const bestTax = result ? Math.min(result.oldTax, result.newTax) : 0;
  const saving = result?.saving || 0;

  return (
    <>
      <Head>
        <title>Income Tax Calculator | ITRGenie</title>
        <meta name="description" content="Compare Old vs New Tax Regime for FY 2025-26. Free income tax calculator by ITRGenie." />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/40 font-['Inter']">
        
        {/* ─── FLOATING BOT WIDGET (BACK TO HOME) ─── */}
        <Link href="/" passHref>
          <div className="fixed bottom-8 right-8 z-50 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
                <i className="fas fa-robot text-3xl text-white"></i>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
              </div>
              <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition duration-300 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                Go back to Home
                <div className="absolute top-full right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </Link>

        {/* ─── HEADER with Sky Blue Gradient ─── */}
        <div className="relative bg-gradient-to-r from-sky-400 via-sky-300 to-blue-300 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 bg-white/30 text-indigo-800 px-4 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                  Free & Instant
                </span>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-3 drop-shadow-lg">
                  Income Tax Calculator
                </h1>
                <p className="text-indigo-100 mt-1 text-sm md:text-base font-medium drop-shadow">
                  Compare Old vs New Regime for AY 2026-27
                </p>
              </div>
              {/* No language toggle */}
            </div>
          </div>
        </div>

        {/* ─── MAIN CONTENT ─── */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-10 border border-white/50">
            <div className="grid lg:grid-cols-2 gap-8">

              {/* LEFT: INPUT PANEL */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-2xl p-6 shadow-xl border border-indigo-800/30">
                  {/* Tabs */}
                  <div className="flex gap-2 mb-6 bg-indigo-950/50 p-1 rounded-xl">
                    <button
                      onClick={() => setActiveTab("quick")}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                        activeTab === "quick"
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                          : "text-indigo-300 hover:text-white hover:bg-indigo-800/50"
                      }`}
                    >
                      <i className="fas fa-bolt mr-2"></i> Quick
                    </button>
                    <button
                      onClick={() => setActiveTab("detailed")}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                        activeTab === "detailed"
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                          : "text-indigo-300 hover:text-white hover:bg-indigo-800/50"
                      }`}
                    >
                      <i className="fas fa-list-ul mr-2"></i> Detailed
                    </button>
                  </div>

                  {/* Age Group */}
                  <div className="mb-5">
                    <label className="block text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                      <i className="fas fa-user mr-1"></i> Age Group
                    </label>
                    <select
                      value={form.ageGroup}
                      onChange={(e) => set("ageGroup")(e.target.value)}
                      className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="below60">Below 60</option>
                      <option value="above60">60 – 80 Years</option>
                      <option value="above80">Above 80 Years</option>
                    </select>
                  </div>

                  {/* Quick Inputs */}
                  {activeTab === "quick" && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                          <i className="fas fa-rupee-sign mr-1"></i> Annual Gross Income
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={form.grossIncome}
                            onChange={(e) => set("grossIncome")(e.target.value)}
                            className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-xl pl-10 pr-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. 1200000"
                          />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5000000"
                          step="50000"
                          value={form.grossIncome}
                          onChange={handleIncomeSlider}
                          className="w-full mt-3 h-2 bg-indigo-800/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-indigo-400 mt-1">
                          <span>₹0</span>
                          <span>₹50L</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                          <i className="fas fa-receipt mr-1"></i> Deductions (80C, 80D, etc.)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={form.deductions}
                            onChange={(e) => set("deductions")(e.target.value)}
                            className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. 150000"
                          />
                        </div>
                        <p className="text-indigo-400 text-xs mt-1">Enter total deductions under various sections</p>
                      </div>
                    </div>
                  )}

                  {/* Detailed Inputs */}
                  {activeTab === "detailed" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Salary", key: "salary" },
                          { label: "Business", key: "business" },
                          { label: "House Property", key: "house" },
                          { label: "Other Income", key: "other" },
                        ].map(({ label, key }) => (
                          <div key={key}>
                            <label className="block text-indigo-300 text-xs font-semibold mb-1">{label}</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-sm">₹</span>
                              <input
                                type="number"
                                value={form[key]}
                                onChange={(e) => set(key)(e.target.value)}
                                className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-lg pl-7 pr-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <hr className="border-indigo-800/50" />
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "80C (max ₹1.5L)", key: "d80c" },
                          { label: "80D Health", key: "d80d" },
                          { label: "HRA Exemption", key: "hra" },
                          { label: "Home Loan Interest", key: "home" },
                        ].map(({ label, key }) => (
                          <div key={key}>
                            <label className="block text-indigo-300 text-xs font-semibold mb-1">{label}</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-sm">₹</span>
                              <input
                                type="number"
                                value={form[key]}
                                onChange={(e) => set(key)(e.target.value)}
                                className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-lg pl-7 pr-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: RESULTS PANEL */}
              {result && (
                <div className="space-y-6">
                  {/* Best Regime Widget */}
                  <div className={`relative overflow-hidden rounded-2xl p-6 text-white ${
                    isNewBetter 
                      ? "bg-gradient-to-br from-emerald-600 to-teal-600" 
                      : isOldBetter 
                      ? "bg-gradient-to-br from-blue-600 to-indigo-600" 
                      : "bg-gradient-to-br from-gray-700 to-gray-800"
                  } shadow-2xl`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                    <div className="relative z-10 text-center">
                      <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Best Regime for You</div>
                      <div className="text-3xl md:text-4xl font-extrabold mt-2">{result.betterRegime}</div>
                      <div className="text-2xl font-bold mt-1">{formatCurrency(bestTax)}</div>
                      {saving > 0 && (
                        <div className="inline-block mt-3 bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-semibold">
                          🎉 You Save {formatCurrency(saving)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Side-by-Side Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`bg-white rounded-xl p-4 shadow-lg border-2 ${
                      isOldBetter ? "border-indigo-500 shadow-indigo-100" : "border-gray-200"
                    }`}>
                      <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Old Regime</div>
                      <div className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(result.oldTax)}</div>
                      {isOldBetter && (
                        <span className="inline-block mt-2 bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full font-semibold">
                          ⭐ Best for you
                        </span>
                      )}
                    </div>
                    <div className={`bg-white rounded-xl p-4 shadow-lg border-2 ${
                      isNewBetter ? "border-emerald-500 shadow-emerald-100" : "border-gray-200"
                    }`}>
                      <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">New Regime</div>
                      <div className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(result.newTax)}</div>
                      {isNewBetter && (
                        <span className="inline-block mt-2 bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-semibold">
                          ⭐ Best for you
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comparison Table */}
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-700"><i className="fas fa-table mr-2"></i>Tax Breakdown</h3>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                        <tr>
                          <th className="px-6 py-3 text-left">Particulars</th>
                          <th className="px-6 py-3 text-right">Old</th>
                          <th className="px-6 py-3 text-right">New</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[
                          { label: "Gross Income", old: result.grossIncome, nw: result.grossIncome },
                          { label: "Std Deduction", old: 50000, nw: 75000 },
                          { label: "Total Deductions", old: result.totalOldDed, nw: 75000 },
                          { label: "Taxable Income", old: result.tiOld, nw: result.tiNew },
                          { label: "Tax Payable", old: result.oldTax, nw: result.newTax, highlight: true },
                        ].map(({ label, old, nw, highlight }) => (
                          <tr key={label} className={highlight ? "bg-indigo-50/50" : ""}>
                            <td className={`px-6 py-3 font-medium ${highlight ? "text-indigo-700" : "text-gray-700"}`}>
                              {label}
                            </td>
                            <td className={`px-6 py-3 text-right ${highlight ? "text-indigo-600 font-bold" : "text-gray-600"}`}>
                              {formatCurrency(old)}
                            </td>
                            <td className={`px-6 py-3 text-right ${highlight ? "text-indigo-600 font-bold" : "text-gray-600"}`}>
                              {formatCurrency(nw)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Notes */}
                  <div className="bg-gradient-to-br from-gray-50 to-indigo-50/50 rounded-xl p-4 border border-gray-200 text-xs text-gray-500 space-y-1">
                    <p><i className="fas fa-info-circle mr-1 text-indigo-400"></i> Standard Deduction: ₹50,000 (Old) / ₹75,000 (New)</p>
                    <p><i className="fas fa-info-circle mr-1 text-indigo-400"></i> Capital gains and special rates are not included in this calculator</p>
                    <p><i className="fas fa-info-circle mr-1 text-indigo-400"></i> Surcharge & Cess are applied as per applicable rates</p>
                    <p><i className="fas fa-exclamation-triangle mr-1 text-amber-400"></i> This is an estimate. Please consult a tax professional.</p>
                  </div>

                  {/* Share / Download */}
                  <div className="flex justify-end gap-3">
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      <i className="fas fa-share-alt mr-1"></i> Share
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      <i className="fas fa-download mr-1"></i> Download PDF
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-10 text-center text-xs text-gray-400 border-t border-gray-200 pt-6">
              © 2026 ITRGenie · Made with ❤️ · itrgenie.co.in
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================
// getStaticProps for i18n (kept for future use)
// ============================================
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "calculator"])),
    },
  };
}
