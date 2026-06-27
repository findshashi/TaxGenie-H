import { useState, useCallback, useEffect, useRef } from 'react'

export default function Chatbot() {
  // State
  const [isOpen, setIsOpen] = useState(false)        // true = chat panel open
  const [showBot, setShowBot] = useState(true)       // false = widget completely hidden
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle sending a message
  const sendMessage = useCallback(() => {
    if (!input.trim()) return

    // Add user message
    const userMsg = { text: input, sender: 'user' }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    // Simulate bot response (you can replace with real API)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        text: 'Thanks for your message! Our expert will get back to you shortly.',
        sender: 'bot'
      }])
    }, 1000)
  }, [input])

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }

  // Toggle chat panel open/close (minimize)
  const toggleChat = () => setIsOpen(prev => !prev)

  // Fully close the widget
  const closeWidget = () => setShowBot(false)

  // If widget is hidden, return nothing
  if (!showBot) return null

  // Floating button (when chat is closed or minimized)
  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 group cursor-pointer"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition duration-300"></div>
          {/* Main button */}
          <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
            <i className="fas fa-robot text-3xl text-white"></i>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
          </div>
        </div>
      </button>
    )
  }

  // Chat panel open
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-indigo-100 flex flex-col overflow-hidden animate-fadeInUp">
      {/* Header – with Minimize (–) and Close (×) */}
      <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex items-center gap-2">
          <i className="fas fa-robot text-white text-xl"></i>
          <span className="font-bold text-white">ITRGenie Assistant</span>
          <span className="text-xs text-green-300">● Online</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Minimize button */}
          <button
            onClick={toggleChat}
            className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded transition"
            title="Minimize"
          >
            <i className="fas fa-minus text-sm"></i>
          </button>
          {/* Close button */}
          <button
            onClick={closeWidget}
            className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded transition"
            title="Close"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <i className="fas fa-robot text-3xl mb-2 block"></i>
            <p>Ask us anything about your ITR filing!</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[80%] p-3 rounded-xl text-sm ${
              msg.sender === 'user'
                ? 'ml-auto bg-indigo-600 text-white rounded-br-none'
                : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none shadow-sm'
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-3 bg-white flex items-center gap-2">
        <input
          type="text"
          placeholder="Type your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  )
}
