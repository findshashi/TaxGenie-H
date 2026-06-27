// pages/api/send-email.js
// POST /api/send-email
// Sends an email from a service team member to a client.
// Requires the sender to have an @itrgenie.com email address.

import { supabaseAdmin, getUserFromRequest, isServiceTeam } from '../../lib/supabaseAdmin';
import { sendEmail } from '../../lib/resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Authenticate and check service team access ─────────
  const { user, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorised – please log in' });
  }

  if (!isServiceTeam(user)) {
    return res.status(403).json({
      error: 'Only service team members (@itrgenie.com) can send emails from this endpoint',
    });
  }

  // ── 2. Validate request body ──────────────────────────────
  const { caseId, subject, body, toEmail } = req.body || {};

  if (!caseId)  return res.status(400).json({ error: 'caseId is required' });
  if (!subject) return res.status(400).json({ error: 'subject is required' });
  if (!body)    return res.status(400).json({ error: 'body is required' });

  if (subject.length > 200) {
    return res.status(400).json({ error: 'Subject must be 200 characters or less' });
  }
  if (body.length > 10000) {
    return res.status(400).json({ error: 'Body must be 10,000 characters or less' });
  }

  // ── 3. Fetch case + client email ──────────────────────────
  const { data: caseRow, error: caseError } = await supabaseAdmin
    .from('cases')
    .select('id, user_id')
    .eq('id', caseId)
    .single();

  if (caseError || !caseRow) {
    return res.status(404).json({ error: 'Case not found' });
  }

  // Fetch client email from auth.users via the admin API
  let recipientEmail = toEmail?.trim();
  if (!recipientEmail) {
    const { data: clientUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      caseRow.user_id
    );
    if (userError || !clientUser?.user?.email) {
      return res.status(500).json({ error: 'Could not retrieve client email address' });
    }
    recipientEmail = clientUser.user.email;
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    return res.status(400).json({ error: 'Invalid recipient email address' });
  }

  // ── 4. Send email via Resend ──────────────────────────────
  let emailResult;
  try {
    emailResult = await sendEmail({
      to:      recipientEmail,
      subject,
      body,
      replyTo: 'support@itrgenie.com',
    });
  } catch (emailErr) {
    console.error('[send-email] Resend error:', emailErr.message);
    return res.status(502).json({
      error: 'Failed to send email. Please try again in a few minutes.',
    });
  }

  // ── 5. Store message in messages table ────────────────────
  const { error: msgError } = await supabaseAdmin.from('messages').insert({
    case_id:         caseId,
    sender_id:       user.id,
    recipient_email: recipientEmail,
    subject,
    body,
    direction:       'outgoing',
    external_id:     emailResult?.id || null,
  });

  if (msgError) {
    // Email was sent – log the DB error but don't fail the response
    console.error('[send-email] Failed to save message record:', msgError.message);
  }

  return res.status(200).json({
    success: true,
    messageId: emailResult?.id || null,
    sentTo:    recipientEmail,
    message:   'Email sent successfully',
  });
}
