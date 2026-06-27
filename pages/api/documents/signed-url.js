// pages/api/documents/signed-url.js
// POST /api/documents/signed-url
// Generates a short-lived signed URL so authorised users can download
// a document without exposing the raw storage path.

import { supabaseAdmin, getUserFromRequest, isServiceTeam } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Authenticate ───────────────────────────────────────
  const { user, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorised – please log in' });
  }

  const { documentId } = req.body || {};

  if (!documentId) {
    return res.status(400).json({ error: 'documentId is required' });
  }

  // ── 2. Fetch document record ──────────────────────────────
  const { data: doc, error: docError } = await supabaseAdmin
    .from('documents')
    .select('id, case_id, filename, storage_path, type')
    .eq('id', documentId)
    .single();

  if (docError || !doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // ── 3. Check access ───────────────────────────────────────
  const { data: caseRow, error: caseError } = await supabaseAdmin
    .from('cases')
    .select('id, user_id')
    .eq('id', doc.case_id)
    .single();

  if (caseError || !caseRow) {
    return res.status(404).json({ error: 'Associated case not found' });
  }

  const canAccess = caseRow.user_id === user.id || isServiceTeam(user);
  if (!canAccess) {
    return res.status(403).json({ error: 'You do not have permission to download this file' });
  }

  // ── 4. Generate signed URL (valid for 60 minutes) ─────────
  const EXPIRES_IN_SECONDS = 60 * 60; // 1 hour

  const { data: urlData, error: urlError } = await supabaseAdmin.storage
    .from('documents')
    .createSignedUrl(doc.storage_path, EXPIRES_IN_SECONDS, {
      download: doc.filename, // triggers browser download with original filename
    });

  if (urlError || !urlData?.signedUrl) {
    console.error('[signed-url] Error generating signed URL:', urlError?.message);
    return res.status(500).json({ error: 'Could not generate download link' });
  }

  return res.status(200).json({
    success:   true,
    signedUrl: urlData.signedUrl,
    filename:  doc.filename,
    expiresIn: EXPIRES_IN_SECONDS,
    message:   'Download link is valid for 1 hour',
  });
}
