// pages/profile.js
// Client profile completion / edit page.
// PAN is the single most important field for ITR filing — validated client-side
// and server-side, and given visual priority on this page.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
];

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);

  const [fullName, setFullName]       = useState('');
  const [phone, setPhone]             = useState('');
  const [pan, setPan]                 = useState('');
  const [city, setCity]               = useState('');
  const [state, setState]             = useState('');

  const [panTouched, setPanTouched]   = useState(false);
  const [message, setMessage]         = useState(null); // { type, text }

  // ── Load session + existing profile ───────────────────────
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/auth/login?redirect=/profile');
        return;
      }
      setUser(session.user);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, phone, pan, city, state')
        .eq('id', session.user.id)
        .single();

      if (!error && profile) {
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
        setPan(profile.pan || '');
        setCity(profile.city || '');
        setState(profile.state || '');
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const panValid   = pan.length === 0 || PAN_REGEX.test(pan);
  const panMissing = pan.trim().length === 0;

  // ── Save handler ────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    setMessage(null);

    const trimmedPan = pan.trim().toUpperCase();

    if (trimmedPan && !PAN_REGEX.test(trimmedPan)) {
      setPanTouched(true);
      setMessage({
        type: 'error',
        text: 'PAN must be in the format ABCDE1234F (5 letters, 4 digits, 1 letter).',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          phone:     phone.trim() || null,
          pan:       trimmedPan || null,
          city:      city.trim() || null,
          state:     state || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setPan(trimmedPan);

      // Return to dashboard shortly after a successful save
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err) {
      console.error('Profile save error:', err);
      setMessage({
        type: 'error',
        text: err.message?.includes('profiles_pan_format_check')
          ? 'PAN format is invalid. Please use the format ABCDE1234F.'
          : 'Could not save your profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Complete Your Profile – ITRGenie</title>
      </Head>

      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-slate-400 hover:text-slate-600 mb-3 flex items-center gap-1"
            >
              ← Back to dashboard
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Complete your profile</h1>
            <p className="text-slate-500 text-sm mt-1">
              We need a few details to start preparing your tax filing.
            </p>
          </div>

          {/* Status message */}
          {message && (
            <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium border
              ${message.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">

            {/* ── PAN — given top priority and its own card ──────── */}
            <div className="bg-white rounded-xl border-2 border-indigo-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-indigo-600 text-lg">🪪</span>
                <label htmlFor="pan" className="text-sm font-semibold text-slate-800">
                  PAN Number
                </label>
                <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                  Required for filing
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Your Permanent Account Number is required by the Income Tax Department
                to file your return. This must exactly match your PAN card.
              </p>
              <input
                id="pan"
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                onBlur={() => setPanTouched(true)}
                placeholder="ABCDE1234F"
                maxLength={10}
                className={`w-full text-lg font-mono tracking-widest uppercase border rounded-lg px-4 py-3
                  focus:outline-none focus:ring-2 transition
                  ${panTouched && !panValid
                    ? 'border-red-300 focus:ring-red-400 bg-red-50'
                    : 'border-slate-200 focus:ring-indigo-400'}`}
              />
              {panTouched && !panValid && (
                <p className="text-xs text-red-500 mt-2">
                  Invalid format. PAN should look like ABCDE1234F.
                </p>
              )}
              {panMissing && !panTouched && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ You won't be able to file your return without a valid PAN.
                </p>
              )}
            </div>

            {/* ── Other personal details ───────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-1">Personal details</h2>

              <div>
                <label htmlFor="fullName" className="text-xs font-medium text-slate-500 mb-1 block">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="As per your PAN card"
                  className="w-full text-sm border border-slate-200 rounded-lg px-4 py-2.5
                             focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label htmlFor="phone" className="text-xs font-medium text-slate-500 mb-1 block">
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full text-sm border border-slate-200 rounded-lg px-4 py-2.5
                             focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="text-xs font-medium text-slate-500 mb-1 block">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full text-sm border border-slate-200 rounded-lg px-4 py-2.5
                               focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="text-xs font-medium text-slate-500 mb-1 block">
                    State
                  </label>
                  <select
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-4 py-2.5
                               focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full text-sm border border-slate-200 rounded-lg px-4 py-2.5
                             bg-slate-50 text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`w-full py-3 rounded-lg text-sm font-semibold transition shadow-sm
                ${saving
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
