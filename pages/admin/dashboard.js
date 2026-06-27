"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabaseClient'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/auth/login')
      } else {
        // For now, let's check if email contains 'admin'
        // You can set proper admin role in Supabase later
        if (session.user.email?.includes('admin')) {
          setIsAdmin(true)
        }
      }
      setLoading(false)
    })
  }, [router])

  if (loading) return <div className="text-center py-20">Loading...</div>
  if (!isAdmin) return <div className="text-center py-20">Unauthorized access</div>

  return (
    <Layout>
      <div className="bg-gray-900 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* User Management */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold text-lg mb-4">User Management</h2>
              <p className="text-gray-400 text-sm">View and manage all registered users</p>
              <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">View All Users</button>
            </div>

            {/* Document Review */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold text-lg mb-4">Document Review</h2>
              <p className="text-gray-400 text-sm">Review pending ITR documents</p>
              <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Review Documents</button>
            </div>

            {/* e-Filing Queue */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold text-lg mb-4">e-Filing Queue</h2>
              <p className="text-gray-400 text-sm">Process pending e-filings</p>
              <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">View Queue</button>
            </div>

            {/* Payment Reports */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold text-lg mb-4">Payment Reports</h2>
              <p className="text-gray-400 text-sm">View payment analytics</p>
              <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Generate Report</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
