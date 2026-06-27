// pages/api/cases/[id].js
// GET   /api/cases/:id  – get full case details with documents & messages
// PATCH /api/cases/:id  – update case (status, assigned_to, data, etc.)

import { supabaseAdmin, getUserFromRequest, isServiceTeam } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  const { id: caseId } = req.query;

  if (!caseId) return res.status(400).json({ error: 'Case ID is required' });

  const { user, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorised – please log in' });
  }

  if (req.method === 'GET')   return getCase(req, res, user, caseId);
  if (req.method === 'PATCH') return updateCase(req, res, user, caseId);
  if (req.method === 'PUT')   return updateCase(req, res, user, caseId);

  return res.status(405).json({ error: 'Method not allowed' });
}

// ─────────────────────────────────────────────────────────────
// GET – full case details
// ─────────────────────────────────────────────────────────────
async function getCase(req, res, user, caseId) {
  const { data: caseRow, error } = await supabaseAdmin
    .from('cases')
    .select(`
      *,
      documents ( * ),
      messages  ( * )
    `)
    .eq('id', caseId)
    .single();

  if (error || !caseRow) {
    return res.status(404).json({ error: 'Case not found' });
  }

  // Access control
  const canView = caseRow.user_id === user.id || isServiceTeam(user);
  if (!canView) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Enrich with client email for service team
  let clientEmail = null;
  if (isServiceTeam(user)) {
    try {
      const { data } = await supabaseAdmin.auth.admin.getUserById(caseRow.user_id);
      clientEmail = data?.user?.email || null;
    } catch (_) {}
  }

  // Sort messages by sent_at asc
  if (caseRow.messages) {
    caseRow.messages.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
  }

  return res.status(200).json({
    ...caseRow,
    clientEmail,
  });
}

// ─────────────────────────────────────────────────────────────
// PATCH – update case
// ─────────────────────────────────────────────────────────────
async function updateCase(req, res, user, caseId) {
  // Fetch existing case first for access check
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('cases')
    .select('id, user_id, data')
    .eq('id', caseId)
    .single();

  if (fetchError || !existing) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const canEdit = existing.user_id === user.id || isServiceTeam(user);
  if (!canEdit) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const body = req.body || {};

  // Build the update object – only allow specific fields
  const updates = {};

  // Service-team-only fields
  if (isServiceTeam(user)) {
    if (body.status !== undefined) {
      const validStatuses = ['pending', 'in_progress', 'review', 'completed', 'rejected'];
      if (!validStatuses.includes(body.status)) {
        return res.status(400).json({ error: `Invalid status: ${body.status}` });
      }
      updates.status = body.status;
    }

    if (body.assigned_to !== undefined) {
      updates.assigned_to = body.assigned_to || null;
    }
  }

  // Both roles can update these
  if (body.form_type !== undefined) {
    const validTypes = ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'];
    if (!validTypes.includes(body.form_type)) {
      return res.status(400).json({ error: `Invalid form_type: ${body.form_type}` });
    }
    updates.form_type = body.form_type;
  }

  if (body.client_notes !== undefined) {
    updates.client_notes = body.client_notes?.trim() || null;
  }

  // Merge partial data updates into existing JSONB data
  if (body.data && typeof body.data === 'object') {
    updates.data = { ...(existing.data || {}), ...body.data };
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update' });
  }

  updates.updated_at = new Date().toISOString();

  const { data: updatedCase, error: updateError } = await supabaseAdmin
    .from('cases')
    .update(updates)
    .eq('id', caseId)
    .select()
    .single();

  if (updateError) {
    console.error('[cases/[id]] Update error:', updateError.message);
    return res.status(500).json({ error: 'Failed to update case' });
  }

  return res.status(200).json({ success: true, case: updatedCase });
}
