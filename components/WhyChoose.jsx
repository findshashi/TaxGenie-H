import { useState } from 'react'

const features = [
  {
    icon: 'fa-headphones',
    title: 'Live Screen Share Assistance',
    description: 'Real-time guidance from a tax expert who reviews your return with you on screen. Get instant clarifications.',
    gradient: 'from-blue-500 to-cyan-400',
    bgGradient: 'from-blue-50 to-cyan-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    shadowColor: 'shadow-blue-200/50',
    stats: '98% Satisfaction'
  },
  {
    icon: 'fa-clock',
    title: '60-Minute Session',
    description: 'Get your entire filing done in under an hour – no more waiting for days. Fast, efficient, and stress-free.',
    gradient: 'from-purple-500 to-pink-400',
    bgGradient: 'from-purple-50 to-pink-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    borderColor: 'border-purple-200',
    shadowColor: 'shadow-purple-200/50',
    stats: 'Avg 45 min'
  },
  {
    icon: 'fa-shield-alt',
    title: '100% Secure & Compliant',
    description: 'Your financial data is encrypted with bank‑grade security. We never share your info. ISO 27001 certified.',
    gradient: 'from-green-500 to-emerald-400',
    bgGradient: 'from-green-50 to-emerald-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    borderColor: 'border-green-200',
    shadowColor: 'shadow-green-200/50',
    stats: '256-bit Encryption'
  },
  {
    icon: 'fa-download',
    title: 'Instant Download & E-Verify',
    description: 'Download your filed ITR‑V acknowledgment immediately after e‑verification. Get your return in minutes.',
    gradient: 'from-orange-500 to-red-400',
    bgGradient: 'from-orange-50 to-red-50',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    shadowColor: 'shadow-orange-200/50',
    stats: 'Instant Access'
  },
]

export default function WhyChoose() {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-medium mb-4 shadow-lg shadow-indigo-200/50">
            <i className="fas fa-star text-yellow-300"></i>
            <span>Why Thousands Trust ITRGenie</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4">
            Why Choose <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">ITRGenie</span>?
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            We make tax filing simple, fast, and secure. Here's why thousands trust us with their returns.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`relative group transition-all duration-500 hover:-translate-y-3 ${
                hoveredIndex === index ? 'scale-105' : ''
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Glow background */}
              <div 
                className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`}
              ></div>
              
              <div className={`relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border ${feature.borderColor} h-full`}>
                {/* Icon with pulse animation */}
                <div className={`relative w-20 h-20 ${feature.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg`}>
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
                  <i className={`fas ${feature.icon} text-4xl ${feature.iconColor} relative z-10`}></i>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 text-center mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                  {feature.title}
                </h3>

                <p className="text-gray-600 text-center text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Stat badge */}
                <div className={`mt-4 inline-block w-full text-center text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${feature.gradient} text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500`}>
                  {feature.stats}
                </div>

                {/* Decorative line */}
                <div className={`w-12 h-1 bg-gradient-to-r ${feature.gradient} mx-auto mt-4 rounded-full transition-all duration-300 group-hover:w-20`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges - Animated Stats */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center group cursor-pointer">
              <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">10K+</div>
              <div className="text-sm text-gray-500 mt-1">Returns Filed</div>
              <div className="w-full h-1 bg-gradient-to-r from-indigo-200 to-purple-200 mt-2 rounded-full"></div>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform">4.9★</div>
              <div className="text-sm text-gray-500 mt-1">User Rating</div>
              <div className="w-full h-1 bg-gradient-to-r from-green-200 to-emerald-200 mt-2 rounded-full"></div>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform">99.9%</div>
              <div className="text-sm text-gray-500 mt-1">Accuracy Rate</div>
              <div className="w-full h-1 bg-gradient-to-r from-orange-200 to-red-200 mt-2 rounded-full"></div>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform">30min</div>
              <div className="text-sm text-gray-500 mt-1">Avg Filing Time</div>
              <div className="w-full h-1 bg-gradient-to-r from-purple-200 to-pink-200 mt-2 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Additional Trust Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5 text-center border border-blue-100">
            <i className="fas fa-certificate text-3xl text-blue-500 mb-2"></i>
            <h4 className="font-semibold text-gray-800">ISO 27001 Certified</h4>
            <p className="text-sm text-gray-600">Information security management</p>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 text-center border border-purple-100">
            <i className="fas fa-lock text-3xl text-purple-500 mb-2"></i>
            <h4 className="font-semibold text-gray-800">Bank-Grade Encryption</h4>
            <p className="text-sm text-gray-600">256-bit SSL security</p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 text-center border border-green-100">
            <i className="fas fa-headset text-3xl text-green-500 mb-2"></i>
            <h4 className="font-semibold text-gray-800">24/7 Expert Support</h4>
            <p className="text-sm text-gray-600">Dedicated tax professionals</p>
          </div>
        </div>
      </div>
    </section>
  )
}
