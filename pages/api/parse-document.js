// pages/api/parse-document.js
// POST /api/parse-document
// Re-parses a previously uploaded PDF to (re-)extract fields.
// Useful if the original extraction failed or needs to be refreshed.

import { supabaseAdmin, getUserFromRequest, isServiceTeam } from '../../lib/supabaseAdmin';
import { parseDocumentText, mergeExtractedData } from '../../lib/pdfParser';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Authenticate ───────────────────────────────────────
  const { user, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorised – please log in again' });
  }

  const { caseId, documentId } = req.body || {};

  if (!caseId || !documentId) {
    return res.status(400).json({ error: 'Both caseId and documentId are required' });
  }

  // ── 2. Fetch document record ──────────────────────────────
  const { data: docRecord, error: docError } = await supabaseAdmin
    .from('documents')
    .select('id, case_id, filename, storage_path, type, mime_type')
    .eq('id', documentId)
    .eq('case_id', caseId)
    .single();

  if (docError || !docRecord) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // ── 3. Check access ───────────────────────────────────────
  const { data: caseRow, error: caseError } = await supabaseAdmin
    .from('cases')
    .select('id, user_id, data')
    .eq('id', caseId)
    .single();

  if (caseError || !caseRow) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const canAccess = caseRow.user_id === user.id || isServiceTeam(user);
  if (!canAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // ── 4. Only PDFs can be parsed ────────────────────────────
  if (docRecord.mime_type !== 'application/pdf') {
    return res.status(422).json({
      error: 'Only PDF files can be parsed for data extraction',
    });
  }

  // ── 5. Download file from Supabase Storage ────────────────
  const { data: fileData, error: downloadError } = await supabaseAdmin.storage
    .from('documents')
    .download(docRecord.storage_path);

  if (downloadError || !fileData) {
    console.error('[parse-document] Download error:', downloadError?.message);
    return res.status(500).json({ error: 'Could not retrieve file from storage' });
  }

  // ── 6. Parse PDF ──────────────────────────────────────────
  let extractedData = null;
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);

    extractedData = parseDocumentText(pdfData.text, docRecord.type);
  } catch (parseErr) {
    console.error('[parse-document] PDF parse error:', parseErr.message);
    return res.status(500).json({
      error: 'Could not parse this PDF. The file may be scanned or password-protected.',
    });
  }

  if (!extractedData) {
    return res.status(422).json({
      error: 'No data could be extracted from this document. It may be an unsupported format.',
    });
  }

  // ── 7. Merge and save extracted data ─────────────────────
  const mergedData = mergeExtractedData(caseRow.data || {}, extractedData);

  const { error: updateError } = await supabaseAdmin
    .from('cases')
    .update({ data: mergedData, updated_at: new Date().toISOString() })
    .eq('id', caseId);

  if (updateError) {
    console.error('[parse-document] Case update error:', updateError.message);
    return res.status(500).json({ error: 'Data extracted but failed to save to case' });
  }

  // Mark document as processed
  await supabaseAdmin
    .from('documents')
    .update({ processed: true })
    .eq('id', documentId);

  return res.status(200).json({
    success: true,
    extractedData,
    message: 'Document parsed and case data updated',
  });
}
