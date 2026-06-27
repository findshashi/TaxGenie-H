import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'

export default function GetStarted() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState(null)

  const plans = [
    {
      id: 'itr1',
      title: 'ITR-1 (Sahaj)',
      subtitle: 'For Salaried Individuals & Pensioners',
      icon: 'fa-user-tie',
      color: 'from-green-500 to-emerald-400',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600',
      features: [
        'Salary/Pension income',
        'Interest income',
        'Up to 2 house properties',
        'Total income up to ₹50 lakh'
      ],
      bestFor: 'Most salaried taxpayers with simple income sources.',
      popular: false
    },
    {
      id: 'itr2',
      title: 'ITR-2',
      subtitle: 'For Capital Gains, Foreign Assets & Higher Income',
      icon: 'fa-chart-line',
      color: 'from-blue-500 to-cyan-400',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
      features: [
        'Sale of shares, mutual funds, or property',
        'Foreign assets or foreign income',
        'More than 2 house properties',
        'Income above ₹50 lakh'
      ],
      bestFor: 'Individuals without business income but with investments or complex income.',
      popular: true
    },
    {
      id: 'itr3',
      title: 'ITR-3',
      subtitle: 'For Business & Professional Income',
      icon: 'fa-briefcase',
      color: 'from-orange-500 to-red-400',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-600',
      features: [
        'Proprietorship business',
        'Freelancing or consulting',
        'Professional practice',
        'Trading income (F&O, intraday, etc.)'
      ],
      bestFor: 'Individuals earning from business or profession.',
      popular: false
    },
    {
      id: 'itr4',
      title: 'ITR-4 (Sugam)',
      subtitle: 'For Presumptive Taxation',
      icon: 'fa-file-signature',
      color: 'from-purple-500 to-pink-400',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
      features: [
        'Small businesses under Section 44AD',
        'Professionals under Section 44ADA',
        'Goods transport operators under Section 44AE',
        'Income up to ₹50 lakh'
      ],
      bestFor: 'Eligible taxpayers opting for presumptive taxation.',
      popular: false
    }
  ]

  const handleSelect = (planId) => {
    setSelectedPlan(planId)
    // Navigate to signup with plan parameter
    router.push(`/auth/signup?plan=${planId}`)
  }

  // Generate floating currency symbols
  const currencySymbols = ['₹', '$', '€', '₹', '$', '€', '₹', '$', '€', '₹', '$', '€']
  
  return (
    <Layout>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
        
        {/* ── Floating Currency Symbols Background ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {currencySymbols.map((symbol, index) => {
            const size = 20 + Math.random() * 60
            const left = Math.random() * 90 + 5
            const top = Math.random() * 90 + 5
            const delay = Math.random() * 5
            const duration = 15 + Math.random() * 20
            const opacity = 0.04 + Math.random() * 0.06
            
            return (
              <div
                key={index}
                className="absolute text-indigo-600 font-bold animate-float"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  fontSize: `${size}px`,
                  opacity: opacity,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              >
                {symbol}
              </div>
            )
          })}
        </div>

        {/* ── Main Content ── */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24">
          {/* Header - REMOVED duplicate ITRGenie, "Got an account?", Log In, English */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              Choose Your Income Tax Return <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                (AY 2026-27)
              </span>
            </h1>
            <p className="text-gray-500">Select the return form that best matches your income profile.</p>
          </div>

          {/* Plan Cards - Grid 2x2 */}
          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 ${
                  selectedPlan === plan.id 
                    ? 'border-indigo-500 shadow-indigo-100 scale-105' 
                    : `${plan.borderColor} hover:border-indigo-300 hover:-translate-y-2`
                }`}
                onClick={() => handleSelect(plan.id)}
              >
                {/* Popular Badge - Now shows on ITR-2 */}
                {plan.popular && (
                  <span className="absolute -top-3 left-6 bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs px-4 py-1 rounded-full shadow-lg animate-pulse">
                    ⭐ Most Popular
                  </span>
                )}

                {/* Header with Icon and Title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0
                    bg-gradient-to-r ${plan.color} shadow-lg
                    transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
                  `}>
                    <i className={`fas ${plan.icon} text-xl text-white`}></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition">
                      {plan.title}
                    </h3>
                    <p className="text-sm text-gray-500">{plan.subtitle}</p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <i className={`fas fa-check-circle ${plan.textColor} mt-0.5 text-xs`}></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Best For */}
                <div className={`${plan.bgColor} rounded-xl p-3 mb-4 border ${plan.borderColor}`}>
                  <p className="text-xs font-medium">
                    <span className="text-gray-600">Best for:</span>{' '}
                    <span className={plan.textColor}>{plan.bestFor}</span>
                  </p>
                </div>

                {/* Select Button */}
                <button className={`
                  w-full py-3 rounded-xl font-semibold transition-all duration-300
                  bg-gradient-to-r ${plan.color} text-white
                  hover:shadow-lg hover:scale-105
                `}>
                  Select {plan.title}
                  <i className="fas fa-arrow-right ml-2"></i>
                </button>

                {/* Hover Glow */}
                <div className={`
                  absolute -inset-0.5 bg-gradient-to-r ${plan.color} rounded-2xl opacity-0 
                  group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10
                `}></div>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-400">
              <i className="fas fa-lock mr-1 text-green-500"></i> 
              Your information is secure and encrypted
            </p>
            <div className="flex justify-center gap-6 mt-4 text-xs text-gray-400">
              <span>🔒 256-bit SSL</span>
              <span>✓ GDPR Compliant</span>
              <span>✓ Data Privacy</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-20px) rotate(5deg);
          }
          75% {
            transform: translateY(20px) rotate(-5deg);
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  )
}
