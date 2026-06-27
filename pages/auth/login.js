import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import Layout from '../../components/Layout'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address.')
        setLoading(false)
        return
      }
      if (!password || password.length < 6) {
        setError('Please enter your password.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('Invalid email or password. Please try again.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email address first. Check your inbox/spam folder.')
        } else {
          setError(error.message)
        }
        setLoading(false)
        return
      }

      if (data.user) {
        router.push('/dashboard')
      } else {
        setError('Login failed. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      setError('Network error. Please check your internet connection and try again.')
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

            {/* ── RIGHT COLUMN: Login Form ── */}
            <div className="w-full max-w-md mx-auto lg:max-w-full">
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-sign-in-alt text-3xl text-white"></i>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Login to ITRGenie</h2>
                  <p className="text-sm text-gray-500 mt-2">Access your tax dashboard securely</p>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
                    <i className="fas fa-exclamation-circle mt-0.5"></i>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
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
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="text-right">
                    <Link href="/auth/forgot-password">
                      <span className="text-sm text-indigo-600 hover:underline cursor-pointer">
                        Forgot your password?
                      </span>
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition"
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i> Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/auth/signup">
                    <span className="text-indigo-600 hover:underline font-medium cursor-pointer">Sign up</span>
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
