import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import Layout from '../../components/Layout'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      // Validate email
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address.')
        setLoading(false)
        return
      }

      // Get the current origin for the redirect URL
      const origin = typeof window !== 'undefined' ? window.location.origin : ''

      console.log('Sending reset email to:', email)
      console.log('Redirect URL:', `${origin}/auth/reset-password`)

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/reset-password`,
      })

      console.log('Supabase response:', { data, error })

      if (error) {
        console.error('Reset password error:', error)
        setError(error.message || 'Failed to send reset link. Please try again.')
      } else {
        setMessage('✅ Password reset link sent to your email. Please check your inbox (and spam folder).')
        setEmail('')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Network error. Please check your internet connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl mt-16">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-key text-3xl text-white"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Reset Your Password</h2>
          <p className="text-sm text-gray-500 mt-2">
            Enter your registered email and we'll send you a reset link.
          </p>
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

        <form onSubmit={handleReset} className="mt-6 space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i> Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Remember your password?{' '}
          <Link href="/auth/login">
            <span className="text-indigo-600 hover:underline font-medium cursor-pointer">Login</span>
          </Link>
        </p>

        {/* Debug info - remove in production */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-400 border border-gray-200">
          <p className="font-medium text-gray-500">Debug Info:</p>
          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</p>
          <p>Make sure your Supabase project has Email auth enabled.</p>
        </div>
      </div>
    </Layout>
  )
}
