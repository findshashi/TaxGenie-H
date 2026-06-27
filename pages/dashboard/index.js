import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabaseClient'

export default function Dashboard() {
  const router = useRouter()

  // ── Auth & profile state ──
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [filings, setFilings] = useState([])
  const [docs, setDocs]       = useState([])
  const [loading, setLoading] = useState(true)

  // ── Upload state ──
  const [uploading, setUploading]   = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [parsedFields, setParsedFields] = useState(null)
  const form16Ref = useRef(null)
  const form26Ref = useRef(null)

  // ── Load data on mount ──
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return }
      setUser(session.user)
      await loadProfile(session.user.id)
      await loadFilings(session.user.id)
      await loadDocs(session.user.id)
      setLoading(false)
    })
  }, [])

  const loadProfile = async (uid) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
    setProfile(data)
  }

  const loadFilings = async (uid) => {
    const { data } = await supabase
      .from('itr_filings')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setFilings(data || [])
  }

  // ── FIXED: documents table has no rows (nothing writes to it).
  // Form 16 and 26AS uploads actually land in form16_data / tax_26as_data.
  // Pull from both and merge into one list the UI can render, in the
  // same shape the rest of the component expects (doc_type, created_at, parsed).
  const loadDocs = async (uid) => {
    const [form16Res, taxAsRes] = await Promise.all([
      supabase
        .from('form16_data')
        .select('id, created_at, assessment_year, parsed_data, file_path')
        .eq('user_id', uid),
      supabase
        .from('tax_26as_data')
        .select('id, created_at, parsed_data, file_path')
        .eq('user_id', uid),
    ])

    const form16Docs = (form16Res.data || []).map((d) => ({
      id: d.id,
      doc_type: 'form16',
      created_at: d.created_at,
      assessment_year: d.assessment_year,
      parsed: !!d.parsed_data,
      file_path: d.file_path,
    }))

    const taxAsDocs = (taxAsRes.data || []).map((d) => ({
      id: d.id,
      doc_type: '26as',
      created_at: d.created_at,
      assessment_year: null,
      parsed: !!d.parsed_data,
      file_path: d.file_path,
    }))

    const merged = [...form16Docs, ...taxAsDocs].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )

    setDocs(merged)
  }

  // ── File upload + parse ──
  const handleUpload = async (e, docType) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    setParsedFields(null)
    setUploadStatus(`⏳ Uploading & parsing ${docType === 'form16' ? 'Form 16' : 'Form 26AS'}...`)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user_id', user.id)
      formData.append('doc_type', docType)

      const res = await fetch('/api/parse-form16', { method: 'POST', body: formData })
      const data = await res.json()

      if (res.ok && data.success) {
        setParsedFields(data.fields)
        setUploadStatus(`✅ ${docType === 'form16' ? 'Form 16' : 'Form 26AS'} parsed! Fields auto-filled below.`)
        await loadDocs(user.id)
      } else {
        // Show the server's actual error instead of a generic message
        setUploadStatus(`⚠️ ${data.error || 'Some fields could not be read. Please review manually.'}`)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setUploadStatus('❌ Upload failed. Please check your connection and try again.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // ── Computed stats ──
  const latestFiling  = filings[0] || null
  const totalRefund   = filings.reduce((s, f) => s + (f.refund_due || 0), 0)
  const statusColor   = {
    draft: 'text-yellow-600 bg-yellow-50',
    review: 'text-blue-600 bg-blue-50',
    submitted: 'text-green-600 bg-green-50',
    acknowledged: 'text-indigo-600 bg-indigo-50',
  }

  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Welcome back, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0]} 👋
              </h1>
              <p className="text-gray-500 mt-1">
                AY 2026-27 · FY 2025-26
                {profile?.pan && <span className="ml-3 text-indigo-600 font-medium">PAN: {profile.pan}</span>}
              </p>
            </div>
            <button
              onClick={() => router.push('/filing/new')}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 shadow flex items-center gap-2"
            >
              <i className="fas fa-plus"></i> New Filing
            </button>
          </div>

          {/* ── Stats Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">ITR Status</p>
              {latestFiling ? (
                <span className={`text-sm font-bold px-2 py-1 rounded-full ${statusColor[latestFiling.status] || 'text-gray-600 bg-gray-50'}`}>
                  {latestFiling.status.charAt(0).toUpperCase() + latestFiling.status.slice(1)}
                </span>
              ) : (
                <p className="text-lg font-bold text-orange-500">Not Filed</p>
              )}
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Estimated Refund</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{totalRefund.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Documents</p>
              <p className="text-2xl font-bold text-indigo-600">{docs.length}</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Filings</p>
              <p className="text-2xl font-bold">{filings.length}</p>
            </div>
          </div>

          {/* ── Profile Completion Banner ── */}
          {!profile?.pan && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <i className="fas fa-exclamation-triangle text-amber-500 text-xl"></i>
                <div>
                  <p className="font-semibold text-amber-800">Complete your profile</p>
                  <p className="text-sm text-amber-600">Add your PAN, phone, and address to start filing.</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/profile')}
                className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600"
              >
                Complete Now →
              </button>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Left column: Upload + Parsed Fields ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Document Upload Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <i className="fas fa-file-upload text-indigo-600 text-xl"></i>
                  <h2 className="text-xl font-bold text-gray-800">Upload Documents</h2>
                  <span className="ml-auto text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">Auto-fills ITR fields</span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Form 16 Upload */}
                  <div
                    className="border-2 border-dashed border-indigo-200 rounded-xl p-5 text-center hover:border-indigo-400 hover:bg-indigo-50 transition cursor-pointer"
                    onClick={() => form16Ref.current?.click()}
                  >
                    <i className="fas fa-file-pdf text-3xl text-red-400 mb-2"></i>
                    <p className="font-semibold text-gray-700">Form 16</p>
                    <p className="text-xs text-gray-400 mt-1">Salary TDS certificate from employer</p>
                    <p className="text-xs text-indigo-500 mt-2">Click to upload PDF</p>
                    <input
                      ref={form16Ref}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => handleUpload(e, 'form16')}
                    />
                  </div>

                  {/* 26AS Upload */}
                  <div
                    className="border-2 border-dashed border-green-200 rounded-xl p-5 text-center hover:border-green-400 hover:bg-green-50 transition cursor-pointer"
                    onClick={() => form26Ref.current?.click()}
                  >
                    <i className="fas fa-file-alt text-3xl text-green-400 mb-2"></i>
                    <p className="font-semibold text-gray-700">Form 26AS / AIS</p>
                    <p className="text-xs text-gray-400 mt-1">Annual tax statement from IT portal</p>
                    <p className="text-xs text-green-500 mt-2">Click to upload PDF</p>
                    <input
                      ref={form26Ref}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => handleUpload(e, '26as')}
                    />
                  </div>
                </div>

                {/* Upload status */}
                {uploading && (
                  <div className="flex items-center gap-3 bg-indigo-50 rounded-lg p-3">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-indigo-700">Parsing document with AI...</span>
                  </div>
                )}
                {uploadStatus && !uploading && (
                  <div className={`rounded-lg p-3 text-sm ${uploadStatus.startsWith('✅') ? 'bg-green-50 text-green-700' : uploadStatus.startsWith('❌') ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                    {uploadStatus}
                  </div>
                )}

                {/* Parsed Fields Display */}
                {parsedFields && (
                  <div className="mt-4 border border-green-200 rounded-xl p-4 bg-green-50">
                    <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                      <i className="fas fa-magic"></i> Auto-extracted fields
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(parsedFields).map(([key, val]) => val ? (
                        <div key={key} className="bg-white rounded-lg p-2.5 border border-green-100">
                          <p className="text-xs text-gray-400 capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {typeof val === 'number' ? `₹${val.toLocaleString('en-IN')}` : val}
                          </p>
                        </div>
                      ) : null)}
                    </div>
                    <button
                      onClick={() => router.push('/filing/new')}
                      className="mt-4 w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700"
                    >
                      Use these fields to file ITR →
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Filings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  <i className="fas fa-history text-indigo-400 mr-2"></i>My Filings
                </h2>
                {filings.length === 0 ? (
                  <div className="text-center py-10">
                    <i className="fas fa-file-alt text-5xl text-gray-200 mb-3"></i>
                    <p className="text-gray-400 text-sm">No filings yet.</p>
                    <button
                      onClick={() => router.push('/filing/new')}
                      className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                      Start your first filing →
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-400 border-b">
                          <th className="pb-3 font-medium">AY</th>
                          <th className="pb-3 font-medium">Type</th>
                          <th className="pb-3 font-medium">Total Income</th>
                          <th className="pb-3 font-medium">Tax / Refund</th>
                          <th className="pb-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filings.map((f) => (
                          <tr key={f.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/filing/${f.id}`)}>
                            <td className="py-3 font-medium">{f.assessment_year}</td>
                            <td className="py-3 text-gray-500">{f.itr_type}</td>
                            <td className="py-3">₹{(f.total_income || 0).toLocaleString('en-IN')}</td>
                            <td className="py-3">
                              {f.refund_due > 0
                                ? <span className="text-green-600 font-medium">+₹{f.refund_due.toLocaleString('en-IN')}</span>
                                : <span className="text-red-500">₹{(f.tax_due || 0).toLocaleString('en-IN')}</span>}
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[f.status] || 'text-gray-600 bg-gray-100'}`}>
                                {f.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right column: Profile + Documents ── */}
            <div className="space-y-6">

              {/* Profile Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-bold text-gray-800 mb-4">
                  <i className="fas fa-user text-indigo-400 mr-2"></i>Profile
                </h2>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Name', value: profile?.full_name },
                    { label: 'Email', value: user?.email },
                    { label: 'Phone', value: profile?.phone },
                    { label: 'PAN', value: profile?.pan },
                    { label: 'City', value: profile?.city },
                    { label: 'State', value: profile?.state },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-400">{label}</span>
                      <span className="font-medium text-gray-700 text-right max-w-[60%] truncate">
                        {value || <span className="text-red-400 text-xs">Missing</span>}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push('/profile')}
                  className="mt-4 w-full border border-indigo-200 text-indigo-600 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50"
                >
                  Edit Profile →
                </button>
              </div>

              {/* Uploaded Documents */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-bold text-gray-800 mb-4">
                  <i className="fas fa-folder text-indigo-400 mr-2"></i>Documents
                  <span className="ml-2 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{docs.length}</span>
                </h2>
                {docs.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {docs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 border border-gray-50">
                        <i className={`fas fa-file-${doc.doc_type === 'form16' ? 'pdf text-red-400' : 'alt text-green-400'}`}></i>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {doc.doc_type === 'form16' ? 'Form 16' : doc.doc_type === '26as' ? 'Form 26AS' : doc.doc_type}
                          </p>
                          <p className="text-xs text-gray-400">
                            {doc.assessment_year || 'AY 2026-27'} · {new Date(doc.created_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        {doc.parsed && <i className="fas fa-check-circle text-green-500 text-xs"></i>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-bold text-gray-800 mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Start New Filing', icon: 'fa-plus', href: '/filing/new', color: 'bg-indigo-600 text-white hover:bg-indigo-700' },
                    { label: 'Tax Calculator', icon: 'fa-calculator', href: '/tools/income-tax-calculator', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                    { label: 'Download Forms', icon: 'fa-download', href: '/resources/forms', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                    { label: 'Talk to Expert', icon: 'fa-headset', href: '/support', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                  ].map(({ label, icon, href, color }) => (
                    <button
                      key={label}
                      onClick={() => router.push(href)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition ${color}`}
                    >
                      <i className={`fas ${icon}`}></i> {label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
