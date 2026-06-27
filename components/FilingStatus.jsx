import { useState } from 'react'

const steps = [
  {
    id: 1,
    title: 'Upload Documents',
    description: 'Form 16, AIS, 26AS, salary slips and capital gains statements — straight to Tax Vault.',
    icon: 'fa-cloud-upload-alt',
    color: 'from-blue-500 to-cyan-400',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    status: 'completed'
  },
  {
    id: 2,
    title: 'Review Computation',
    description: 'We prepare the computation and show tax due or refund before filing.',
    icon: 'fa-calculator',
    color: 'from-purple-500 to-pink-400',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    status: 'current'
  },
  {
    id: 3,
    title: 'Choose Your Plan',
    description: 'Self, assisted, live, capital gains, foreign income, ITR-U or business filing.',
    icon: 'fa-file-invoice',
    color: 'from-indigo-500 to-blue-400',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    status: 'pending'
  },
  {
    id: 4,
    title: 'File Your Return',
    description: 'Your ITR is filed online through TaxSpanner securely as ERI-authorized intermediary.',
    icon: 'fa-check-circle',
    color: 'from-green-500 to-emerald-400',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    status: 'pending'
  },
  {
    id: 5,
    title: 'Confirmation & Support',
    description: 'Receive ITR-V, e-verify and keep getting return-related support after filing.',
    icon: 'fa-headset',
    color: 'from-orange-500 to-red-400',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    status: 'pending'
  }
]

export default function FilingStatus() {
  const [activeStep, setActiveStep] = useState(1)
  
  // Simulate progress
  const handleStepClick = (stepId) => {
    setActiveStep(stepId)
  }

  const getStatusStyles = (stepId) => {
    if (stepId < activeStep) {
      return {
        border: 'border-green-500',
        bg: 'bg-green-500',
        text: 'text-green-600',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        lineColor: 'bg-green-500',
        statusText: 'Completed',
        statusColor: 'text-green-600'
      }
    } else if (stepId === activeStep) {
      return {
        border: 'border-indigo-500',
        bg: 'bg-indigo-500',
        text: 'text-indigo-600',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        lineColor: 'bg-indigo-500',
        statusText: 'In Progress',
        statusColor: 'text-indigo-600'
      }
    } else {
      return {
        border: 'border-gray-300',
        bg: 'bg-gray-300',
        text: 'text-gray-400',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-400',
        lineColor: 'bg-gray-300',
        statusText: 'Pending',
        statusColor: 'text-gray-400'
      }
    }
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-medium mb-4 shadow-lg shadow-indigo-200/50">
            <i className="fas fa-rocket text-yellow-300"></i>
            <span>Your Filing Journey</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Track Your <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ITR Filing Status</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Follow these steps to complete your income tax return filing. We guide you every step of the way.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-600">Overall Progress</span>
            <span className="text-sm font-bold text-indigo-600">{Math.round((activeStep / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${(activeStep / steps.length) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">Start</span>
            <span className="text-xs text-gray-400">Complete</span>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const styles = getStatusStyles(step.id)
            const isActive = step.id === activeStep
            const isCompleted = step.id < activeStep

            return (
              <div
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={`relative group cursor-pointer transition-all duration-300 ${
                  isActive ? 'scale-105' : 'hover:scale-102'
                }`}
              >
                <div className={`
                  bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2
                  ${isActive ? 'border-indigo-500 shadow-indigo-100' : isCompleted ? 'border-green-500' : 'border-gray-200'}
                `}>
                  {/* Step Number & Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                        ${isActive ? 'bg-indigo-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                      `}>
                        {isCompleted ? <i className="fas fa-check"></i> : step.id}
                      </div>
                      <span className="text-xs font-medium text-gray-500">STEP {String(step.id).padStart(2, '0')}</span>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                      isActive ? 'bg-indigo-100 text-indigo-600' : 
                      isCompleted ? 'bg-green-100 text-green-600' : 
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {styles.statusText}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4
                    ${isActive ? 'bg-gradient-to-r from-indigo-100 to-purple-100' : 
                      isCompleted ? 'bg-green-100' : 'bg-gray-100'}
                    transition-all duration-300 group-hover:scale-110
                  `}>
                    <i className={`fas ${step.icon} text-3xl ${
                      isActive ? 'text-indigo-600' : 
                      isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}></i>
                  </div>

                  {/* Title & Description */}
                  <h3 className={`text-lg font-bold text-center mb-2 ${
                    isActive ? 'text-indigo-600' : 
                    isCompleted ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 text-center leading-relaxed">
                    {step.description}
                  </p>

                  {/* Decorative Line */}
                  <div className={`
                    w-12 h-1 mx-auto mt-4 rounded-full transition-all duration-300
                    ${isActive ? 'bg-gradient-to-r from-indigo-600 to-purple-600 w-20' : 
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'}
                  `}></div>

                  {/* Glow Effect on Hover */}
                  <div className={`
                    absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10
                    ${isActive ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 
                      isCompleted ? 'bg-green-500' : 'bg-gray-400'}
                  `}></div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <button 
            onClick={() => activeStep > 1 && setActiveStep(activeStep - 1)}
            disabled={activeStep === 1}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <i className="fas fa-arrow-left mr-2"></i> Previous Step
          </button>
          <button 
            onClick={() => activeStep < steps.length && setActiveStep(activeStep + 1)}
            disabled={activeStep === steps.length}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-200/50"
          >
            {activeStep === steps.length ? 'All Complete! 🎉' : 'Next Step'}
            {activeStep < steps.length && <i className="fas fa-arrow-right ml-2"></i>}
          </button>
          {activeStep === steps.length && (
            <button className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition shadow-lg shadow-green-200/50">
              <i className="fas fa-check-circle mr-2"></i> View Your ITR-V
            </button>
          )}
        </div>

        {/* Completion Message */}
        {activeStep === steps.length && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-2xl text-center animate-fadeIn">
            <i className="fas fa-trophy text-4xl text-green-500 mb-3"></i>
            <h3 className="text-xl font-bold text-green-800">🎉 Filing Complete!</h3>
            <p className="text-green-600 mt-1">Your ITR has been successfully filed. Check your email for ITR-V confirmation.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </section>
  )
}
