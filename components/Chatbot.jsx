import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Chatbot() {
  // ===== STATE =====
  const [isOpen, setIsOpen] = useState(false)          // chat panel open/closed
  const [showBot, setShowBot] = useState(true)         // widget visible/hidden
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hello! 👋 I'm ITRGenie, your tax assistant. What's your name?" }
  ])
  const [input, setInput] = useState('')
  const [step, setStep] = useState(0)                  // 0: name, 1: pan, 2: mobile, 3: email, 4: done
  const [leadData, setLeadData] = useState({ name: '', pan: '', mobile: '', email: '' })
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  // ===== AUTO-SCROLL TO LATEST MESSAGE =====
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ===== FOCUS INPUT WHEN CHAT OPENS =====
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // ===== SEND MESSAGE HANDLER =====
  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { type: 'user', text: userMessage }])

    let newStep = step
    let botResponse = ''

    switch (step) {
      case 0: // Collect NAME
        setLeadData(prev => ({ ...prev, name: userMessage }))
        newStep = 1
        botResponse = `Nice to meet you, ${userMessage}! 😊 Please share your PAN number (e.g., ABCDE1234F).`
        break

      case 1: // Collect PAN
        const pan = userMessage.toUpperCase().replace(/\s/g, '')
        if (pan.length < 10) {
          setMessages(prev => [...prev, { type: 'bot', text: 'Please enter a valid 10-digit PAN (e.g., ABCDE1234F).' }])
          return
        }
        setLeadData(prev => ({ ...prev, pan }))
        newStep = 2
        botResponse = 'Got it! Now please share your 10-digit WhatsApp number (e.g., 9876543210).'
        break

      case 2: // Collect MOBILE
        const mobile = userMessage.replace(/\D/g, '')
        if (mobile.length !== 10) {
          setMessages(prev => [...prev, { type: 'bot', text: 'Please enter a valid 10-digit phone number.' }])
          return
        }
        setLeadData(prev => ({ ...prev, mobile }))
        newStep = 3
        botResponse = 'Almost done! Finally, please provide your email address.'
        break

      case 3: // Collect EMAIL
        const email = userMessage.toLowerCase()
        if (!email.includes('@') || !email.includes('.')) {
          setMessages(prev => [...prev, { type: 'bot', text: 'Please enter a valid email address (e.g., you@example.com).' }])
          return
        }
        setLeadData(prev => ({ ...prev, email }))
        newStep = 4

        // Save lead to Supabase
        setIsTyping(true)
        try {
          const finalData = { ...leadData, email }
          const { error } = await supabase.from('leads').insert({
            name: finalData.name,
            phone: finalData.mobile,
            email: finalData.email,
            pan: finalData.pan,
            source: 'chatbot',
            bot_responses: finalData,
            status: 'new',
          })

          if (error) {
            console.error('Lead save error:', error)
            botResponse = "We're having trouble saving your details. Our expert will still contact you! 📞"
          } else {
            console.log('Lead saved successfully to Supabase')
            botResponse = `Thank you, ${finalData.name}! 🎉 Our tax expert will contact you on ${finalData.mobile} shortly. Would you like to start filing now?`
          }
        } catch (err) {
          console.error('Unexpected error:', err)
          botResponse = "We're having technical issues. Please try again later or contact us directly. 🙏"
        }
        setIsTyping(false)
        break

      default: // Step 4 – Done
        botResponse = "You can start filing by clicking 'Get Started' above. Need anything else? Just type your question!"
        // Keep step at 4 (don't increment)
        break
    }

    // Add bot response (with delay for realism)
    if (botResponse) {
      setTimeout(() => {
        setMessages(prev => [...prev, { type: 'bot', text: botResponse }])
      }, 500)
    }

    setStep(newStep)
  }, [input, step, leadData])

  // ===== HANDLE ENTER KEY =====
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // ===== TOGGLE CHAT PANEL (MINIMIZE) =====
  const toggleChat = () => setIsOpen(prev => !prev)

  // ===== FULLY CLOSE WIDGET =====
  const closeWidget = () => setShowBot(false)

  // ===== GET PLACEHOLDER TEXT =====
  const getPlaceholder = () => {
    const placeholders = [
      'Type your name...',
      'Enter PAN (e.g., ABCDE1234F)',
      'Enter 10-digit WhatsApp number',
      'Enter email address',
      'Type your question...'
    ]
    return placeholders[Math.min(step, 4)]
  }

  // ===== IF WIDGET IS HIDDEN, RETURN NOTHING =====
  if (!showBot) return null

  // ===== FLOATING BUTTON (WHEN CHAT IS CLOSED) =====
  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 group cursor-pointer"
        aria-label="Open ITRGenie chat"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition duration-300"></div>
          <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
            <i className="fas fa-robot text-3xl text-white"></i>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
          </div>
        </div>
      </button>
    )
  }

  // ===== CHAT PANEL =====
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-indigo-100 flex flex-col overflow-hidden animate-fadeInUp">
      
      {/* ── HEADER – with Minimize (–) and Close (×) ── */}
      <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex items-center gap-2">
          <i className="fas fa-robot text-white text-xl"></i>
          <span className="font-bold text-white text-sm">ITRGenie Assistant</span>
          <span className="text-xs text-green-300">● Online</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Minimize button */}
          <button
            onClick={toggleChat}
            className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded transition"
            title="Minimize"
            aria-label="Minimize chat"
          >
            <i className="fas fa-minus text-sm"></i>
          </button>
          {/* Close button */}
          <button
            onClick={closeWidget}
            className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded transition"
            title="Close"
            aria-label="Close chat"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div className="flex-1 h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.type === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-2 flex-shrink-0">
                <i className="fas fa-robot text-white text-xs"></i>
              </div>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-xl text-sm ${
                msg.type === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl rounded-bl-none p-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── INPUT AREA ── */}
      {step < 4 ? (
        <div className="border-t border-gray-200 p-3 bg-white">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type={step === 3 ? 'email' : step === 2 ? 'tel' : 'text'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
          {step === 0 && (
            <p className="text-xs text-gray-400 mt-2">
              <i className="fas fa-shield-alt mr-1 text-green-500"></i>
              We'll connect you with a tax expert — takes 30 seconds.
            </p>
          )}
        </div>
      ) : (
        // ── DONE STATE ──
        <div className="border-t border-gray-200 p-4 bg-white text-center">
          <p className="text-sm text-gray-600 font-medium mb-2">
            🎉 Our team will contact you shortly!
          </p>
          <a
            href="/auth/signup"
            className="inline-block px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition"
          >
            Start Filing Now →
          </a>
        </div>
      )}
    </div>
  )
}
