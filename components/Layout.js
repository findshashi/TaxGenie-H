"use client"

import Link from 'next/link'
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Layout({ children }) {
  const [user, setUser] = useState(null)
  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)
  const [isTaxToolsOpen, setIsTaxToolsOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState('en')

  // Chat Bot State
  const [showBot, setShowBot] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hello! 👋 I'm ITRGenie, your tax assistant. What's your name?" }
  ])
  const [inputValue, setInputValue] = useState('')
  const [step, setStep] = useState(0) // 0: name, 1: pan, 2: mobile, 3: email, 4: done
  const [leadData, setLeadData] = useState({ name: '', pan: '', mobile: '', email: '' })
  const chatEndRef = useRef(null)

  useEffect(() => {
    // Load saved language preference
    const savedLang = localStorage.getItem('lang') || 'en'
    setCurrentLang(savedLang)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleLanguageToggle = () => {
    const newLang = currentLang === 'en' ? 'hi' : 'en'
    setCurrentLang(newLang)
    localStorage.setItem('lang', newLang)
    window.location.reload()
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProductsOpen && !event.target.closest('.products-dropdown')) setIsProductsOpen(false)
      if (isResourcesOpen && !event.target.closest('.resources-dropdown')) setIsResourcesOpen(false)
      if (isTaxToolsOpen && !event.target.closest('.taxtools-dropdown')) setIsTaxToolsOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isProductsOpen, isResourcesOpen, isTaxToolsOpen])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: inputValue }])

    let newStep = step

    if (step === 0) {
      // Collect name
      setLeadData(prev => ({ ...prev, name: inputValue }))
      newStep = 1
      setMessages(prev => [...prev, {
        type: 'bot',
        text: `Nice to meet you, ${inputValue}! 😊 Please share your PAN number (e.g., ABCDE1234F).`
      }])

    } else if (step === 1) {
      // Collect PAN
      setLeadData(prev => ({ ...prev, pan: inputValue.toUpperCase() }))
      newStep = 2
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "Got it! Now please share your 10-digit WhatsApp number."
      }])

    } else if (step === 2) {
      // Collect mobile
      setLeadData(prev => ({ ...prev, mobile: inputValue.replace(/\D/g, '') }))
      newStep = 3
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "Almost done! Finally, please provide your email address."
      }])

    } else if (step === 3) {
      // Collect email and save lead to Supabase
      const finalData = { ...leadData, email: inputValue }
      setLeadData(finalData)
      newStep = 4

      // Save lead to Supabase leads table
      const { error } = await supabase.from('leads').insert({
        name: finalData.name,
        phone: finalData.mobile,
        email: finalData.email,
        pan: finalData.pan,
        source: 'landing_bot',
        bot_responses: finalData,
        status: 'new',
      })

      if (error) {
        console.error('Lead save error:', error)
      } else {
        console.log('Lead saved successfully to Supabase')
      }

      setMessages(prev => [...prev, {
        type: 'bot',
        text: `Thank you, ${finalData.name}! 🎉 Our tax expert will contact you on ${finalData.mobile} shortly. Would you like to start filing now?`
      }])

    } else {
      // step 4+ — generic response
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "You can start filing by clicking 'Get Started' above. Need anything else?"
      }])
    }

    setStep(newStep)
    setInputValue('')
  }

  // SVG for GenieBot Face
  const GenieBotFace = ({ className = "w-8 h-8" }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="25" fill="url(#gradient)" />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d="M35 35 Q50 25 65 35 L62 48 Q50 52 38 48 Z" fill="#fbbf24" />
      <circle cx="50" cy="45" r="4" fill="#ffffff" />
      <circle cx="38" cy="55" r="4" fill="#ffffff" />
      <circle cx="62" cy="55" r="4" fill="#ffffff" />
      <circle cx="38" cy="55" r="2" fill="#1f2937" />
      <circle cx="62" cy="55" r="2" fill="#1f2937" />
      <path d="M43 65 Q50 75 57 65" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="28" cy="50" r="4" fill="#fbbf24" />
      <circle cx="72" cy="50" r="4" fill="#fbbf24" />
    </svg>
  )

  // Tax Tools list
  const taxTools = [
    { name: "Income Tax Calculator", link: "/tools/income-tax-calculator" },
    { name: "Advance Tax Calculator", link: "/tools/advance-tax-calculator" },
    { name: "SIP Calculator", link: "/tools/sip-calculator" },
    { name: "RD Calculator", link: "/tools/rd-calculator" },
    { name: "NPS Calculator", link: "/tools/nps-calculator" },
    { name: "EPF Calculator", link: "/tools/epf-calculator" },
    { name: "PPF Calculator", link: "/tools/ppf-calculator" },
    { name: "TDS Calculator", link: "/tools/tds-calculator" },
    { name: "HRA Calculator", link: "/tools/hra-calculator" },
    { name: "Gratuity Calculator", link: "/tools/gratuity-calculator" },
    { name: "Rent Receipt Generator", link: "/tools/rent-receipt-generator" },
    { name: "Fixed Deposit Calculator", link: "/tools/fd-calculator" },
    { name: "Home Loan EMI Calculator", link: "/tools/home-loan-emi-calculator" },
    { name: "Crypto Assets Tax Calculator", link: "/tools/crypto-tax-calculator" }
  ]

  const resources = [
    { name: "Tax Guides", link: "/resources/guides" },
    { name: "Blog", link: "/resources/blog" },
    { name: "Video Tutorials", link: "/resources/videos" },
    { name: "Support Center", link: "/support" }
  ]

  // Hindi translations for key UI text
  const t = {
    en: {
      login: 'Login', getStarted: 'Get Started', logout: 'Logout',
      pricing: 'Pricing', howItWorks: 'How it works',
      langBtn: '🇮🇳 हिन्दी', dashboard: 'Dashboard',
      botPlaceholder: ['Type your name...', 'Enter PAN (e.g., ABCDE1234F)', 'Enter 10-digit WhatsApp number', 'Enter email address'],
      startFiling: 'Start filing now →'
    },
    hi: {
      login: 'लॉगिन', getStarted: 'शुरू करें', logout: 'लॉगआउट',
      pricing: 'मूल्य', howItWorks: 'यह कैसे काम करता है',
      langBtn: 'EN English', dashboard: 'डैशबोर्ड',
      botPlaceholder: ['अपना नाम टाइप करें...', 'PAN दर्ज करें (जैसे ABCDE1234F)', '10 अंकों का WhatsApp नंबर', 'ईमेल पता दर्ज करें'],
      startFiling: 'अभी फाइल करें →'
    }
  }[currentLang]

  return (
    <>
      <Head>
        <title>ITRGenie – Fast, Expert-Assisted Income Tax Filing Online</title>
        <meta name="description" content="File your ITR online with expert help. Use our free tax calculator to compare regimes and save maximum tax. Secure & instant filing." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234f46e5' rx='20'/%3E%3Cpath d='M30 40 L70 40 L70 65 L30 65 Z' fill='%23fbbf24' stroke='%23ffffff' stroke-width='2'/%3E%3Ccircle cx='50' cy='52' r='6' fill='%234f46e5'/%3E%3Cpath d='M45 30 L55 30 L52 40 L48 40 Z' fill='%23fbbf24'/%3E%3Cpath d='M35 70 L65 70 L60 80 L40 80 Z' fill='%23ffffff' opacity='0.9'/%3E%3Ccircle cx='38' cy='50' r='2' fill='%234f46e5'/%3E%3Ccircle cx='62' cy='50' r='2' fill='%234f46e5'/%3E%3C/svg%3E" />
      </Head>

      <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <GenieBotFace className="w-10 h-10 rounded-xl shadow-lg transition-transform group-hover:scale-105" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <span className="font-bold text-xl text-gray-800">ITR<span className="text-indigo-600">Genie</span></span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">

              {/* Products Dropdown */}
              <div className="relative products-dropdown">
                <button onClick={() => setIsProductsOpen(!isProductsOpen)} className="text-gray-700 hover:text-indigo-600 font-medium flex items-center gap-1">
                  Products <i className={`fas fa-chevron-down text-xs transition ${isProductsOpen ? 'rotate-180' : ''}`}></i>
                </button>
                {isProductsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border py-2 z-50 animate-fadeIn">
                    <Link href="/get-started?plan=self-itr"><div className="px-4 py-3 hover:bg-indigo-50"><div className="font-semibold">Self ITR Filing</div><div className="text-xs text-gray-500">₹499 + GST</div></div></Link>
                    <Link href="/get-started?plan=expert-assisted"><div className="px-4 py-3 hover:bg-indigo-50 border-t"><div className="font-semibold">Expert Assisted</div><div className="text-xs text-gray-500">₹1,499 + GST</div></div></Link>
                    <Link href="/get-started?plan=live-expert"><div className="px-4 py-3 hover:bg-indigo-50 border-t"><div className="font-semibold">Live ITR Filing</div><div className="text-xs text-gray-500">₹2,999 + GST</div></div></Link>
                  </div>
                )}
              </div>

              {/* Resources Dropdown */}
              <div className="relative resources-dropdown">
                <button onClick={() => setIsResourcesOpen(!isResourcesOpen)} className="text-gray-700 hover:text-indigo-600 font-medium flex items-center gap-1">
                  Resources <i className={`fas fa-chevron-down text-xs transition ${isResourcesOpen ? 'rotate-180' : ''}`}></i>
                </button>
                {isResourcesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border py-2 z-50 animate-fadeIn">
                    {resources.map((item, idx) => (
                      <Link key={idx} href={item.link}><div className="px-4 py-2 hover:bg-indigo-50 text-gray-700">{item.name}</div></Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Tax Tools Dropdown */}
              <div className="relative taxtools-dropdown">
                <button onClick={() => setIsTaxToolsOpen(!isTaxToolsOpen)} className="text-gray-700 hover:text-indigo-600 font-medium flex items-center gap-1">
                  Tax Tools <i className={`fas fa-chevron-down text-xs transition ${isTaxToolsOpen ? 'rotate-180' : ''}`}></i>
                </button>
                {isTaxToolsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border py-2 z-50 animate-fadeIn max-h-96 overflow-y-auto">
                    {taxTools.map((tool, idx) => (
                      <Link key={idx} href={tool.link}><div className="px-4 py-2 hover:bg-indigo-50 text-gray-700 text-sm">{tool.name}</div></Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/#pricing" className="text-gray-700 hover:text-indigo-600">{t.pricing}</Link>
              <Link href="/#how-it-works" className="text-gray-700 hover:text-indigo-600">{t.howItWorks}</Link>
              {user && <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600">{t.dashboard}</Link>}
            </div>

            {/* Auth Buttons + Language Toggle */}
            <div className="hidden md:flex items-center space-x-4">

              {/* Language Toggle Button */}
              <button
                onClick={handleLanguageToggle}
                className="px-3 py-1 text-sm border border-indigo-300 text-indigo-600 rounded-full hover:bg-indigo-50 font-medium transition-colors"
                title="Switch Language / भाषा बदलें"
              >
                {t.langBtn}
              </button>

              {!user ? (
                <>
                  <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600">{t.login}</Link>
                  <Link href="/get-started" className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-full shadow hover:bg-indigo-700">{t.getStarted}</Link>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{user.email?.split('@')[0]}</span>
                  <button onClick={handleLogout} className="px-4 py-2 text-sm text-red-600 hover:text-red-700">{t.logout}</button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-3">
              <button
                onClick={handleLanguageToggle}
                className="px-2 py-1 text-xs border border-indigo-300 text-indigo-600 rounded-full"
              >
                {t.langBtn}
              </button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-700">
                <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t py-4 px-4">
            <div className="space-y-3">
              <Link href="/get-started?plan=self-itr" className="block text-gray-700 py-1">Self ITR Filing</Link>
              <Link href="/get-started?plan=expert-assisted" className="block text-gray-700 py-1">Expert Assisted</Link>
              <Link href="/get-started?plan=live-expert" className="block text-gray-700 py-1">Live ITR Filing</Link>
              <div className="border-t pt-2 mt-2">
                <div className="font-semibold text-gray-800 mb-1">Resources</div>
                {resources.map((item, idx) => <Link key={idx} href={item.link} className="block text-gray-600 text-sm py-1 pl-2">{item.name}</Link>)}
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="font-semibold text-gray-800 mb-1">Tax Tools</div>
                {taxTools.slice(0, 6).map((tool, idx) => <Link key={idx} href={tool.link} className="block text-gray-600 text-sm py-1 pl-2">{tool.name}</Link>)}
                <Link href="/tools" className="block text-indigo-600 text-sm py-1 pl-2">View all →</Link>
              </div>
              <Link href="/#pricing" className="block text-gray-700 py-1">{t.pricing}</Link>
              <Link href="/#how-it-works" className="block text-gray-700 py-1">{t.howItWorks}</Link>
              {!user ? (
                <div className="pt-2 space-y-2">
                  <Link href="/auth/login" className="block text-center border border-indigo-600 text-indigo-600 rounded-lg py-2">{t.login}</Link>
                  <Link href="/get-started" className="block text-center bg-indigo-600 text-white rounded-lg py-2">{t.getStarted}</Link>
                </div>
              ) : (
                <button onClick={handleLogout} className="w-full text-red-600 border border-red-600 rounded-lg py-2">{t.logout}</button>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="min-h-screen">{children}</main>

      {/* ── Chat Bot – with Close (×) and Minimize (–) ── */}
      {showBot && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative">
            {!isChatOpen ? (
              <div onClick={() => setIsChatOpen(true)} className="group cursor-pointer">
                <div className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform animate-bounce-in bg-gradient-to-br from-indigo-500 to-purple-600">
                  <GenieBotFace className="w-12 h-12" />
                </div>
                <div className="text-center text-xs font-semibold text-indigo-600 mt-1">ITRGenie</div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-2xl w-96 max-w-[90vw] border border-indigo-100 animate-fadeInUp flex flex-col" style={{ height: '500px' }}>

                {/* Header – with Close (×) and Minimize (–) */}
                <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <GenieBotFace className="w-8 h-8" />
                    <div>
                      <span className="font-bold text-white block text-sm">ITRGenie Assistant</span>
                      <span className="text-xs text-green-300">● Online</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Minimize button – closes chat window but keeps bot visible */}
                    <button
                      onClick={() => setIsChatOpen(false)}
                      className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded transition"
                      title="Minimize"
                    >
                      <i className="fas fa-minus text-sm"></i>
                    </button>
                    {/* Close button – completely hides the bot */}
                    <button
                      onClick={() => {
                        setIsChatOpen(false)
                        setShowBot(false)
                      }}
                      className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded transition"
                      title="Close"
                    >
                      <i className="fas fa-times text-sm"></i>
                    </button>
                  </div>
                </div>

                {/* Chat messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.type === 'bot' && <GenieBotFace className="w-6 h-6 mr-2 flex-shrink-0 mt-1" />}
                      <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.type === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none shadow-sm'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input area */}
                {step < 4 ? (
                  <div className="p-4 border-t bg-white rounded-b-2xl">
                    <div className="flex gap-2">
                      <input
                        type={step === 3 ? 'email' : step === 2 ? 'tel' : 'text'}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={t.botPlaceholder[step] || 'Type here...'}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <i className="fas fa-arrow-right"></i>
                      </button>
                    </div>
                    {step === 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        {currentLang === 'hi'
                          ? 'हम आपको एक विशेषज्ञ से जोड़ेंगे।'
                          : "We'll connect you with a tax expert — takes 30 seconds."}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 border-t bg-white rounded-b-2xl text-center">
                    <p className="text-sm text-gray-500 mb-2">
                      {currentLang === 'hi' ? 'हमारी टीम जल्द संपर्क करेगी! 🎉' : 'Our team will call you shortly! 🎉'}
                    </p>
                    <Link href="/get-started" className="text-indigo-600 font-medium text-sm hover:underline">
                      {t.startFiling}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-12 pb-8 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GenieBotFace className="w-8 h-8" />
                <h3 className="font-bold text-lg">ITRGenie</h3>
              </div>
              <p className="text-gray-400 text-sm">Trusted since 2025<br />1M+ filings • 1,000+ CAs</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Products</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Self ITR Filing</li>
                <li>Expert Assisted</li>
                <li>Live ITR Filing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Tax Guides</li>
                <li>Blog</li>
                <li>Video Tutorials</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Tools</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Income Tax Calculator</li>
                <li>All Calculators</li>
                <li>Rent Receipt Generator</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-gray-400 text-sm">
            © 2025 ITRGenie. All rights reserved. AY 2026-27
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce-in { 0% { opacity: 0; transform: scale(0.3); } 50% { opacity: 1; transform: scale(1.05); } 100% { transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.3s ease-out; }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
      `}</style>
    </>
  )
}
