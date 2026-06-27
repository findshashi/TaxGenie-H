// pages/service-dashboard.js
// Service Team Dashboard for ITRGenie
// Access restricted to itrgenie.com email addresses

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:     { bg: 'bg-yellow-100',  text: 'text-yellow-800',  dot: 'bg-yellow-400'  },
  in_progress: { bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-400'    },
  review:      { bg: 'bg-purple-100',  text: 'text-purple-800',  dot: 'bg-purple-400'  },
  completed:   { bg: 'bg-green-100',   text: 'text-green-800',   dot: 'bg-green-400'   },
  rejected:    { bg: 'bg-red-100',     text: 'text-red-800',     dot: 'bg-red-400'     },
};

const STATUS_LABELS = {
  pending:     'Pending',
  in_progress: 'In Progress',
  review:      'Under Review',
  completed:   'Completed',
  rejected:    'Rejected',
};

const DOC_TYPE_LABELS = {
  form16:        'Form 16',
  '26as':        '26AS',
  salary_slip:   'Salary Slip',
  capital_gains: 'Capital Gains',
  other:         'Other',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatCurrency(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

// ─────────────────────────────────────────────────────────────
// StatusBadge component
// ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────────────
export default function ServiceDashboard() {
  const router = useRouter();

  // Auth state
  const [user, setUser]           = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data state
  const [cases, setCases]         = useState([]);
  const [totalCases, setTotal]    = useState(0);
  const [casesLoading, setCasesLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseLoading, setCaseLoading]   = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm]     = useState('');
  const [page, setPage]                 = useState(0);
  const PAGE_SIZE = 20;

  // Email composer state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody,    setEmailBody]    = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState(null); // { type: 'success'|'error', text }

  // Upload state
  const [uploading,    setUploading]    = useState(false);
  const [uploadMsg,    setUploadMsg]    = useState(null);

  // ── Auth check ──────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.replace('/auth/login');
        return;
      }
      if (!session.user.email?.endsWith('itrgenie.com')) {
        router.replace('/');
        return;
      }
      setUser(session.user);
      setAuthLoading(false);
    });
  }, [router]);

  // ── Fetch cases ─────────────────────────────────────────────
  const fetchCases = useCallback(async () => {
    if (!user) return;
    setCasesLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const params = new URLSearchParams({
        limit:  PAGE_SIZE,
        offset: page * PAGE_SIZE,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const resp = await fetch(`/api/cases?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!resp.ok) throw new Error('Failed to fetch cases');
      const json = await resp.json();
      setCases(json.cases || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error('Fetch cases error:', err);
    } finally {
      setCasesLoading(false);
    }
  }, [user, statusFilter, page]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  // ── Fetch single case detail ─────────────────────────────────
  async function selectCase(caseId) {
    setCaseLoading(true);
    setSelectedCase(null);
    setEmailMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`/api/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!resp.ok) throw new Error('Could not load case');
      const data = await resp.json();
      setSelectedCase(data);
      setEmailSubject('');
      setEmailBody('');
    } catch (err) {
      console.error('Select case error:', err);
    } finally {
      setCaseLoading(false);
    }
  }

  // ── Update case status ────────────────────────────────────────
  async function updateStatus(newStatus) {
    if (!selectedCase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`/api/cases/${selectedCase.id}`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!resp.ok) throw new Error('Update failed');
      setSelectedCase((prev) => ({ ...prev, status: newStatus }));
      setCases((prev) => prev.map((c) => c.id === selectedCase.id ? { ...c, status: newStatus } : c));
    } catch (err) {
      console.error('Status update error:', err);
    }
  }

  // ── Send email ────────────────────────────────────────────────
  async function handleSendEmail(e) {
    e.preventDefault();
    if (!selectedCase || !emailSubject.trim() || !emailBody.trim()) return;
    setEmailSending(true);
    setEmailMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch('/api/send-email', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          caseId:  selectedCase.id,
          subject: emailSubject.trim(),
          body:    emailBody.trim(),
          toEmail: selectedCase.clientEmail,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Send failed');
      setEmailMessage({ type: 'success', text: `Email sent to ${json.sentTo}` });
      setEmailSubject('');
      setEmailBody('');
      // Refresh case to show new message in thread
      await selectCase(selectedCase.id);
    } catch (err) {
      setEmailMessage({ type: 'error', text: err.message });
    } finally {
      setEmailSending(false);
    }
  }

  // ── Download document ─────────────────────────────────────────
  async function downloadDoc(docId, filename) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch('/api/documents/signed-url', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ documentId: docId }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Could not generate link');
      window.open(json.signedUrl, '_blank');
    } catch (err) {
      alert('Download failed: ' + err.message);
    }
  }

  // ── Re-parse document ─────────────────────────────────────────
  async function reparseDoc(docId) {
    if (!selectedCase) return;
    setUploadMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch('/api/parse-document', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ caseId: selectedCase.id, documentId: docId }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Parse failed');
      setUploadMsg({ type: 'success', text: 'Document re-parsed and case data updated' });
      await selectCase(selectedCase.id);
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.message });
    }
  }

  // ── Upload document ───────────────────────────────────────────
  async function handleUpload(e) {
    if (!selectedCase) return;
    const file    = e.target.files?.[0];
    const docType = e.target.dataset.doctype || 'other';
    if (!file) return;

    setUploading(true);
    setUploadMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append('file',   file);
      formData.append('caseId', selectedCase.id);
      formData.append('type',   docType);

      const resp = await fetch('/api/upload-document', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body:    formData,
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Upload failed');
      setUploadMsg({
        type: 'success',
        text: json.extractedData
          ? 'File uploaded and data extracted successfully!'
          : 'File uploaded successfully (no data extracted).',
      });
      await selectCase(selectedCase.id);
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  // ── Filtered cases ────────────────────────────────────────────
  const filteredCases = cases.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.id.toLowerCase().includes(term) ||
      (c.clientEmail || '').toLowerCase().includes(term) ||
      (c.form_type  || '').toLowerCase().includes(term)
    );
  });

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Service Dashboard – ITRGenie</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* ── Top Navigation ─────────────────────────────────── */}
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
          <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sky-600 text-xl font-bold tracking-tight">ITRGenie</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 text-sm font-medium">Service Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden sm:block">{user?.email}</span>
              <button
                onClick={() => supabase.auth.signOut().then(() => router.push('/auth/login'))}
                className="text-sm text-red-500 hover:text-red-700 font-medium transition"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* ── Main Content ───────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden max-w-screen-2xl mx-auto w-full">

          {/* ── LEFT: Case List ──────────────────────────────── */}
          <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <input
                type="text"
                placeholder="Search by email or case ID…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2
                           focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50"
              />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2
                           focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50"
              >
                <option value="">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400">
                {casesLoading ? 'Loading…' : `${totalCases} case${totalCases !== 1 ? 's' : ''} total`}
              </p>
            </div>

            {/* Case list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {casesLoading && cases.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-sm">Loading cases…</div>
              )}
              {!casesLoading && filteredCases.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-sm">
                  No cases found.<br />
                  {statusFilter && (
                    <button
                      onClick={() => setStatusFilter('')}
                      className="text-sky-500 underline text-xs mt-1"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              )}
              {filteredCases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCase(c.id)}
                  className={`w-full text-left p-4 hover:bg-sky-50 transition group
                    ${selectedCase?.id === c.id ? 'bg-sky-50 border-l-4 border-sky-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono text-slate-400 truncate">
                      #{c.id.slice(0, 8)}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {c.clientEmail || 'Unknown client'}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-slate-400">{c.form_type}</span>
                    <span className="text-xs text-slate-400">{formatDate(c.created_at)}</span>
                  </div>
                  {c.documents?.length > 0 && (
                    <p className="text-xs text-sky-500 mt-1">
                      📎 {c.documents.length} document{c.documents.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalCases > PAGE_SIZE && (
              <div className="p-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="text-xs px-3 py-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                >
                  ← Prev
                </button>
                <span className="text-xs text-slate-400">Page {page + 1}</span>
                <button
                  disabled={(page + 1) * PAGE_SIZE >= totalCases}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs px-3 py-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                >
                  Next →
                </button>
              </div>
            )}
          </aside>

          {/* ── RIGHT: Case Detail ───────────────────────────── */}
          <main className="flex-1 overflow-y-auto p-6">
            {/* Empty state */}
            {!selectedCase && !caseLoading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">Select a case</p>
                <p className="text-sm mt-1">Click on any case in the list to view details</p>
              </div>
            )}

            {caseLoading && (
              <div className="h-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {selectedCase && !caseLoading && (
              <div className="max-w-4xl space-y-6">

                {/* ── Case Header ───────────────────────────────── */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-xl font-bold text-slate-800">
                          Case #{selectedCase.id.slice(0, 8)}
                        </h1>
                        <StatusBadge status={selectedCase.status} />
                      </div>
                      <p className="text-slate-500 text-sm">
                        Client: <span className="font-medium text-slate-700">{selectedCase.clientEmail || '—'}</span>
                      </p>
                      <p className="text-slate-500 text-sm mt-0.5">
                        Filed on {formatDate(selectedCase.created_at)} &nbsp;·&nbsp; {selectedCase.form_type}
                      </p>
                      {selectedCase.client_notes && (
                        <p className="text-slate-500 text-sm mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          📝 {selectedCase.client_notes}
                        </p>
                      )}
                    </div>

                    {/* Status changer */}
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(STATUS_LABELS).map(([v, l]) => (
                          <button
                            key={v}
                            onClick={() => updateStatus(v)}
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition
                              ${selectedCase.status === v
                                ? `${STATUS_COLORS[v].bg} ${STATUS_COLORS[v].text} border-transparent`
                                : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300 hover:text-sky-600'
                              }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Extracted Data ────────────────────────────── */}
                {selectedCase.data && Object.keys(selectedCase.data).length > 1 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-base font-semibold text-slate-800 mb-4">
                      📊 Extracted Tax Data
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(selectedCase.data)
                        .filter(([k, v]) => k !== 'lastUpdated' && v !== null && v !== undefined)
                        .map(([key, value]) => {
                          // Format the key from camelCase to Title Case
                          const label = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, (s) => s.toUpperCase())
                            .trim();

                          // Format the value
                          const isCurrencyKey = /salary|income|tax|deduction|credit|hra|allowance|payable/i.test(key);
                          const display = isCurrencyKey && typeof value === 'number'
                            ? formatCurrency(value)
                            : String(value);

                          return (
                            <div key={key} className="bg-slate-50 rounded-lg p-3">
                              <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                              <p className="text-sm font-semibold text-slate-800 truncate">{display}</p>
                            </div>
                          );
                        })}
                    </div>
                    <p className="text-xs text-slate-400 mt-3">
                      Last updated: {selectedCase.data.lastUpdated
                        ? formatDate(selectedCase.data.lastUpdated)
                        : '—'}
                    </p>
                  </div>
                )}

                {/* ── Documents ─────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-slate-800">📎 Documents</h2>
                    <label className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg
                        cursor-pointer transition
                        ${uploading
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-sky-500 text-white hover:bg-sky-600'}`}
                    >
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        data-doctype="other"
                        disabled={uploading}
                        onChange={handleUpload}
                      />
                      {uploading ? 'Uploading…' : '+ Upload Document'}
                    </label>
                  </div>

                  {uploadMsg && (
                    <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium
                        ${uploadMsg.type === 'success'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {uploadMsg.text}
                    </div>
                  )}

                  {(!selectedCase.documents || selectedCase.documents.length === 0) ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                      No documents uploaded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCase.documents.map((doc) => (
                        <div key={doc.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl">
                              {doc.mime_type === 'application/pdf' ? '📄' : '🖼️'}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">{doc.filename}</p>
                              <p className="text-xs text-slate-400">
                                {DOC_TYPE_LABELS[doc.type] || doc.type}
                                {' '}·{' '}
                                {formatDate(doc.uploaded_at)}
                                {doc.processed && (
                                  <span className="ml-2 text-green-500">✓ Parsed</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {doc.mime_type === 'application/pdf' && (
                              <button
                                onClick={() => reparseDoc(doc.id)}
                                className="text-xs px-2 py-1 rounded border border-slate-200
                                           hover:border-sky-300 hover:text-sky-600 text-slate-500 transition"
                                title="Re-extract data from this PDF"
                              >
                                Re-parse
                              </button>
                            )}
                            <button
                              onClick={() => downloadDoc(doc.id, doc.filename)}
                              className="text-xs px-3 py-1 rounded bg-sky-500 text-white
                                         hover:bg-sky-600 transition font-medium"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Message Thread ────────────────────────────── */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-base font-semibold text-slate-800 mb-4">💬 Message Thread</h2>

                  {(!selectedCase.messages || selectedCase.messages.length === 0) ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No messages yet. Send the first email below.
                    </p>
                  ) : (
                    <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-1">
                      {selectedCase.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-lg border text-sm
                            ${msg.direction === 'outgoing'
                              ? 'bg-sky-50 border-sky-200 ml-6'
                              : 'bg-slate-50 border-slate-200 mr-6'}`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className={`text-xs font-semibold
                              ${msg.direction === 'outgoing' ? 'text-sky-600' : 'text-slate-600'}`}>
                              {msg.direction === 'outgoing' ? '→ Sent to client' : '← Received from client'}
                            </span>
                            <span className="text-xs text-slate-400">{formatDate(msg.sent_at)}</span>
                          </div>
                          <p className="font-medium text-slate-700 mb-1">Subject: {msg.subject}</p>
                          <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Email Composer ─────────────────────────── */}
                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">
                      Send email to: <span className="text-sky-600">{selectedCase.clientEmail || 'client'}</span>
                    </h3>

                    {emailMessage && (
                      <div className={`mb-3 px-4 py-3 rounded-lg text-sm font-medium
                          ${emailMessage.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {emailMessage.text}
                      </div>
                    )}

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Subject line…"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        maxLength={200}
                        className="w-full text-sm border border-slate-200 rounded-lg px-4 py-2.5
                                   focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                      <textarea
                        placeholder="Type your message to the client…"
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows={5}
                        maxLength={5000}
                        className="w-full text-sm border border-slate-200 rounded-lg px-4 py-2.5
                                   focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                          {emailBody.length}/5000 characters
                        </p>
                        <button
                          onClick={handleSendEmail}
                          disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
                          className={`px-5 py-2 rounded-lg text-sm font-semibold transition
                            ${emailSending || !emailSubject.trim() || !emailBody.trim()
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-sky-500 hover:bg-sky-600 text-white shadow-sm'}`}
                        >
                          {emailSending ? 'Sending…' : 'Send Email →'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
