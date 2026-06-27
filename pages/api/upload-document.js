// pages/api/upload-document.js
// POST /api/upload-document
// Accepts a multipart form upload, stores the file in Supabase Storage,
// records metadata in the documents table, and optionally extracts data
// from Form 16 / 26AS PDFs.

import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin, getUserFromRequest, isServiceTeam } from '../../lib/supabaseAdmin';
import { parseDocumentText, mergeExtractedData } from '../../lib/pdfParser';

// Disable Next.js body parsing so formidable can handle multipart
export const config = { api: { bodyParser: false } };

// ─────────────────────────────────────────────────────────────
// Parse the incoming multipart form
// ─────────────────────────────────────────────────────────────
async function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10 MB
      keepExtensions: true,
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

// ─────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Authenticate ───────────────────────────────────────
  const { user, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorised – please log in again' });
  }

  // ── 2. Parse multipart form ───────────────────────────────
  let fields, files;
  try {
    ({ fields, files } = await parseForm(req));
  } catch (err) {
    console.error('[upload-document] Form parse error:', err.message);
    return res.status(400).json({ error: 'Could not read uploaded file' });
  }

  // Formidable v3 returns arrays for fields/files
  const caseId  = Array.isArray(fields.caseId)  ? fields.caseId[0]  : fields.caseId;
  const docType = Array.isArray(fields.type)     ? fields.type[0]    : fields.type || 'other';
  const file    = Array.isArray(files.file)      ? files.file[0]     : files.file;

  if (!caseId) {
    return res.status(400).json({ error: 'caseId is required' });
  }
  if (!file) {
    return res.status(400).json({ error: 'No file received' });
  }

  // ── 3. Verify user owns this case (or is service team) ───
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
    return res.status(403).json({ error: 'You do not have access to this case' });
  }

  // ── 4. Upload file to Supabase Storage ───────────────────
  const originalName = file.originalFilename || file.newFilename || 'upload';
  const safeFilename = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath  = `cases/${caseId}/${Date.now()}_${safeFilename}`;
  const fileBuffer   = fs.readFileSync(file.filepath);
  const mimeType     = file.mimetype || 'application/octet-stream';

  const { error: storageError } = await supabaseAdmin.storage
    .from('documents')
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  // Clean up temp file regardless of outcome
  try { fs.unlinkSync(file.filepath); } catch (_) {}

  if (storageError) {
    console.error('[upload-document] Storage upload error:', storageError.message);
    return res.status(500).json({ error: 'Failed to store file – please try again' });
  }

  // ── 5. Insert record into documents table ────────────────
  const { data: docRecord, error: dbError } = await supabaseAdmin
    .from('documents')
    .insert({
      case_id:      caseId,
      filename:     safeFilename,
      storage_path: storagePath,
      type:         docType,
      size:         file.size,
      mime_type:    mimeType,
      processed:    false,
    })
    .select()
    .single();

  if (dbError) {
    console.error('[upload-document] DB insert error:', dbError.message);
    return res.status(500).json({ error: 'File uploaded but failed to save record' });
  }

  // ── 6. Attempt PDF text extraction ───────────────────────
  let extractedData = null;
  const isPdf = mimeType === 'application/pdf';
  const shouldParse = isPdf && ['form16', '26as'].includes(docType);

  if (shouldParse) {
    try {
      // Dynamically import pdf-parse (avoid issues at build time)
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData  = await pdfParse(fileBuffer);
      extractedData  = parseDocumentText(pdfData.text, docType);

      if (extractedData) {
        // Merge into existing case data
        const mergedData = mergeExtractedData(caseRow.data || {}, extractedData);

        await supabaseAdmin
          .from('cases')
          .update({ data: mergedData, updated_at: new Date().toISOString() })
          .eq('id', caseId);

        // Mark document as processed
        await supabaseAdmin
          .from('documents')
          .update({ processed: true })
          .eq('id', docRecord.id);

        console.log(`[upload-document] Extracted data from ${docType} for case ${caseId}`);
      }
    } catch (parseErr) {
      // Parsing failed – not a fatal error, file is still saved
      console.error('[upload-document] PDF parse error:', parseErr.message);
    }
  }

  // ── 7. Respond ────────────────────────────────────────────
  return res.status(200).json({
    success: true,
    doc: {
      id:           docRecord.id,
      filename:     docRecord.filename,
      storage_path: docRecord.storage_path,
      type:         docRecord.type,
    },
    extractedData: extractedData || null,
    message: extractedData
      ? 'File uploaded and data extracted successfully'
      : 'File uploaded successfully',
  });
}
