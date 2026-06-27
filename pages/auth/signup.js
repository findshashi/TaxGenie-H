import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import Layout from '../../components/Layout'

export default function Signup() {
  const router = useRouter()
  const { plan } = router.query

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [pan, setPan] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (plan) {
      const planNames = {
        itr1: 'ITR-1 (Sahaj)',
        itr2: 'ITR-2',
        itr3: 'ITR-3',
        itr4: 'ITR-4 (Sugam)'
      }
      setSelectedPlan(planNames[plan] || '')
    }
  }, [plan])

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (!fullName.trim()) {
        setError('Please enter your full name.')
        setLoading(false)
        return
      }
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address.')
        setLoading(false)
        return
      }
      if (!mobile || mobile.length < 10) {
        setError('Please enter a valid 10-digit mobile number.')
        setLoading(false)
        return
      }
      if (!pan || pan.length < 10) {
        setError('Please enter a valid 10-digit PAN number.')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.')
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        setLoading(false)
        return
      }
      if (!agreeTerms) {
        setError('Please agree to the Terms & Conditions.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            mobile: mobile,
            pan: pan.toUpperCase(),
            selected_plan: selectedPlan,
          },
        },
      })

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('This email is already registered. Please login instead.')
        } else {
          setError(error.message || 'Signup failed. Please try again.')
        }
        setLoading(false)
        return
      }

      if (data.user) {
        setMessage('✅ Signup successful! Please check your email to confirm your account.')
        setFullName('')
        setEmail('')
        setMobile('')
        setPan('')
        setPassword('')
        setConfirmPassword('')
        setAgreeTerms(false)
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      } else {
        setError('Signup failed. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your internet connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* ── LEFT COLUMN: Image ── */}
            <div className="hidden lg:flex flex-col items-center justify-center relative min-h-[500px]">
              <div className="relative w-full max-w-lg">
                {/* Floating ₹ symbols */}
                <div className="absolute top-10 left-0 text-4xl text-green-400 font-bold animate-float" style={{ animationDelay: '0s' }}>₹</div>
                <div className="absolute top-20 right-0 text-5xl text-blue-400 font-bold animate-float" style={{ animationDelay: '1.5s' }}>₹</div>
                <div className="absolute bottom-40 left-5 text-3xl text-purple-400 font-bold animate-float" style={{ animationDelay: '0.8s' }}>₹</div>
                <div className="absolute bottom-20 right-10 text-4xl text-green-400 font-bold animate-float" style={{ animationDelay: '2.2s' }}>₹</div>
                <div className="absolute top-1/2 left-0 text-2xl text-blue-400 font-bold animate-float" style={{ animationDelay: '1.2s' }}>₹</div>
                <div className="absolute top-1/2 right-0 text-3xl text-purple-400 font-bold animate-float" style={{ animationDelay: '1.8s' }}>₹</div>

                {/* Main card with image */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 shadow-2xl border border-indigo-100">
                  <div className="text-center mb-4">
                    <div className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-3 shadow-lg">
                      <i className="fas fa-university text-4xl text-white"></i>
                    </div>
                  </div>

                  {/* ── YOUR IMAGE ── */}
                  <div className="flex justify-center">
                    {!imageError ? (
                      <img
                        src="/images/465d81e1-f6de-4397-b487-295061f2894c.png"
                        alt="Tax filing illustration"
                        className="w-full max-w-sm rounded-2xl shadow-lg"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-full max-w-sm rounded-2xl shadow-lg bg-gradient-to-br from-indigo-100 to-purple-100 p-12 text-center">
                        <i className="fas fa-file-image text-6xl text-indigo-400 mb-4"></i>
                        <p className="text-gray-500 text-sm">Image not found</p>
                        <p className="text-gray-400 text-xs mt-1">Please place the image in /public/images/</p>
                      </div>
                    )}
                  </div>

                  <div className="text-center mt-4">
                    <p className="text-sm font-semibold text-indigo-600 animate-pulse">
                      <i className="fas fa-check-circle text-green-500 mr-1"></i>
                      Secure your future with ITRGenie
                    </p>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="flex justify-center gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-shield-alt text-green-500"></i>
                    <span className="text-xs text-gray-600">256-bit SSL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-lock text-green-500"></i>
                    <span className="text-xs text-gray-600">Data Privacy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-500"></i>
                    <span className="text-xs text-gray-600">10K+ Users</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Form ── */}
            <div className="w-full max-w-md mx-auto lg:max-w-full">
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-user-plus text-3xl text-white"></i>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedPlan ? `Signing up for ${selectedPlan}` : 'Start filing your ITR with ITRGenie'}
                  </p>
                  {selectedPlan && (
                    <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                      {selectedPlan}
                    </span>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
                    <i className="fas fa-exclamation-circle mt-0.5"></i>
                    <span>{error}</span>
                  </div>
                )}

                {message && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start gap-2">
                    <i className="fas fa-check-circle mt-0.5"></i>
                    <span>{message}</span>
                  </div>
                )}

                <form onSubmit={handleSignup} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Your full name"
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email ID *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile Number *</label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="9876543210"
                      maxLength="10"
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">10-digit mobile number</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">PAN Number *</label>
                    <input
                      type="text"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      required
                      placeholder="ABCDE1234F"
                      maxLength="10"
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                    />
                    <p className="text-xs text-gray-400 mt-1">10-digit PAN (e.g., ABCDE1234F)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password *</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Min 6 characters"
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter your password"
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the{' '}
                      <Link href="/terms">
                        <span className="text-indigo-600 hover:underline cursor-pointer">Terms & Conditions</span>
                      </Link>
                      {' '}and{' '}
                      <Link href="/privacy">
                        <span className="text-indigo-600 hover:underline cursor-pointer">Privacy Policy</span>
                      </Link>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition"
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i> Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/auth/login">
                    <span className="text-indigo-600 hover:underline font-medium cursor-pointer">Login</span>
                  </Link>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  )
}
