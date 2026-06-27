// pages/api/cases/index.js
// GET  /api/cases          – list cases (filtered by role)
// POST /api/cases          – create a new case (client only)

import { supabaseAdmin, getUserFromRequest, isServiceTeam } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  // ── Authenticate ──────────────────────────────────────────
  const { user, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorised – please log in' });
  }

  if (req.method === 'GET') return listCases(req, res, user);
  if (req.method === 'POST') return createCase(req, res, user);

  return res.status(405).json({ error: 'Method not allowed' });
}

// ─────────────────────────────────────────────────────────────
// GET – list cases
// ─────────────────────────────────────────────────────────────
async function listCases(req, res, user) {
  const {
    status,
    assigned_to,
    limit  = '20',
    offset = '0',
  } = req.query;

  const pageLimit  = Math.min(Math.max(parseInt(limit,  10) || 20, 1), 100);
  const pageOffset = Math.max(parseInt(offset, 10) || 0, 0);

  let query = supabaseAdmin
    .from('cases')
    .select(`
      id, status, form_type, data, client_notes,
      created_at, updated_at,
      assigned_to,
      user_id,
      documents ( id, filename, type, processed, uploaded_at )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(pageOffset, pageOffset + pageLimit - 1);

  // Role-based filtering
  if (isServiceTeam(user)) {
    // Service team can see all cases; optionally filter by assigned_to
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
  } else {
    // Clients see only their own cases
    query = query.eq('user_id', user.id);
  }

  // Optional status filter (works for both roles)
  if (status) query = query.eq('status', status);

  const { data: cases, error, count } = await query;

  if (error) {
    console.error('[cases/index] List error:', error.message);
    return res.status(500).json({ error: 'Could not fetch cases' });
  }

  // For service team: enrich with client email
  let enriched = cases || [];
  if (isServiceTeam(user) && enriched.length > 0) {
    const userIds = [...new Set(enriched.map((c) => c.user_id))];

    // Fetch client emails in parallel (admin endpoint)
    const emailMap = {};
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
          if (data?.user?.email) emailMap[uid] = data.user.email;
        } catch (_) {}
      })
    );

    enriched = enriched.map((c) => ({
      ...c,
      clientEmail: emailMap[c.user_id] || null,
    }));
  }

  return res.status(200).json({
    cases: enriched,
    total: count ?? enriched.length,
    limit: pageLimit,
    offset: pageOffset,
  });
}

// ─────────────────────────────────────────────────────────────
// POST – create a new case (clients only)
// ─────────────────────────────────────────────────────────────
async function createCase(req, res, user) {
  if (isServiceTeam(user)) {
    return res.status(403).json({ error: 'Service team members cannot create cases this way' });
  }

  const { form_type = 'ITR-1', client_notes } = req.body || {};

  const validFormTypes = ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'];
  if (!validFormTypes.includes(form_type)) {
    return res.status(400).json({ error: `form_type must be one of: ${validFormTypes.join(', ')}` });
  }

  const { data: newCase, error } = await supabaseAdmin
    .from('cases')
    .insert({
      user_id:      user.id,
      form_type,
      client_notes: client_notes?.trim() || null,
      status:       'pending',
      data:         {},
    })
    .select()
    .single();

  if (error) {
    console.error('[cases/index] Create error:', error.message);
    return res.status(500).json({ error: 'Could not create case' });
  }

  return res.status(201).json({ success: true, case: newCase });
}
