import type { NextApiRequest, NextApiResponse } from 'next'
import PDFParser from 'pdf2json'
import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── pdf2json works via filepath + events, not a simple promise.
// Wrap it so the rest of the route can just `await` plain text. ──
function extractTextFromPdf(filepath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new (PDFParser as any)(null, true)

    parser.on('pdfParser_dataError', (err: any) => {
      reject(new Error(err?.parserError?.message || 'PDF parsing failed'))
    })

    parser.on('pdfParser_dataReady', () => {
      try {
        // getRawTextContent() is provided by pdf2json's "true" mode
        // and gives plain text with page breaks, no rendering needed.
        const text = (parser as any).getRawTextContent()
        resolve(text || '')
      } catch (e) {
        reject(e)
      }
    })

    parser.loadPDF(filepath)
  })
}

// Convert "5,00,000" or "₹5,00,000" style strings to a real number.
// Returns null (not 0) when nothing was found, so we don't overwrite
// existing data with false zeros.
function toNumber(value: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/[,₹\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function extractForm16Fields(text: string) {
  const get = (pattern: RegExp) => (text.match(pattern)?.[1] || '').trim()
  return {
    employer_name:      get(/Name of Employer[:\s]+([A-Z &.,]+)/i) || null,
    employer_tan:       get(/TAN of Employer[:\s]+([A-Z0-9]{10})/i) || null,
    employee_pan:       get(/PAN of Employee[:\s]+([A-Z0-9]{10})/i) || null,
    assessment_year:    get(/Assessment Year[:\s]+(\d{4}-\d{2,4})/i) || null,
    gross_salary:       toNumber(get(/Gross Salary[:\s₹,]+(\d[\d,]+)/i)),
    hra_exemption:      toNumber(get(/House Rent Allowance[:\s₹,]+(\d[\d,]+)/i)),
    standard_deduction: toNumber(get(/Standard Deduction[:\s₹,]+(\d[\d,]+)/i)),
    deduction_80c:      toNumber(get(/(?:80C|Provident Fund)[:\s₹,]+(\d[\d,]+)/i)),
    total_income:       toNumber(get(/Total Income[:\s₹,]+(\d[\d,]+)/i)),
    tax_payable:        toNumber(get(/Tax Payable[:\s₹,]+(\d[\d,]+)/i)),
    tds_deducted:       toNumber(get(/Tax Deducted at Source[:\s₹,]+(\d[\d,]+)/i)),
  }
}

function extractForm26ASFields(text: string) {
  const tdsEntries: any[] = []
  const tdsRegex = /([A-Z0-9]{10})\s+([A-Z &]+)\s+(\d{4}-\d{2})\s+([\d,]+)\s+([\d,]+)/g
  let m
  while ((m = tdsRegex.exec(text)) !== null) {
    tdsEntries.push({
      deductor_tan: m[1],
      deductor_name: m[2],
      quarter: m[3],
      amount_paid: toNumber(m[4]),
      tds_deducted: toNumber(m[5]),
    })
  }
  return {
    pan: (text.match(/PAN[:\s]+([A-Z]{5}\d{4}[A-Z])/i)?.[1] || null),
    tds_entries: tdsEntries,
    total_tds: tdsEntries.reduce((s, e) => s + (e.tds_deducted || 0), 0),
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const form = formidable({ maxFileSize: 10 * 1024 * 1024 })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('[parse-form16] Form parse error:', err)
      return res.status(400).json({ error: 'File parse failed' })
    }

    try {
      const file = Array.isArray(files.file) ? files.file[0] : files.file
      if (!file) {
        return res.status(400).json({ error: 'No file received' })
      }

      const userId  = Array.isArray(fields.user_id)  ? fields.user_id[0]  : (fields.user_id as string)
      const docType = (Array.isArray(fields.doc_type) ? fields.doc_type[0] : (fields.doc_type as string)) || 'form16'

      if (!userId) {
        return res.status(400).json({ error: 'user_id is required' })
      }

      const buffer = fs.readFileSync(file.filepath)

      // ── Extract text using pdf2json (no native deps, no browser APIs) ──
      let text: string
      try {
        text = await extractTextFromPdf(file.filepath)
      } catch (parseErr: any) {
        console.error('[parse-form16] PDF text extraction failed:', parseErr.message)
        try { fs.unlinkSync(file.filepath) } catch (_) {}
        return res.status(422).json({
          error: 'Could not read this PDF. It may be scanned, image-based, or password-protected.',
        })
      }

      const extracted = docType === 'form16'
        ? extractForm16Fields(text)
        : extractForm26ASFields(text)

      // ── Upload to Storage ──────────────────────────────────
      const fileName = `${userId}/${docType}_${Date.now()}.pdf`
      const { error: storageError } = await supabase.storage
        .from('tax-documents')
        .upload(fileName, buffer, {
          contentType: 'application/pdf',
          upsert: true,
        })

      // Clean up temp file regardless of outcome
      try { fs.unlinkSync(file.filepath) } catch (_) {}

      if (storageError) {
        console.error('[parse-form16] Storage error:', storageError.message)
        return res.status(500).json({ error: 'Could not store file' })
      }

      // ── Save parsed data (only columns that actually exist) ─
      // Row shape genuinely differs between form16_data and tax_26as_data,
      // and TypeScript can't reconcile that against Supabase's generated
      // union row types — build it as `any` here intentionally.
      const table = docType === 'form16' ? 'form16_data' : 'tax_26as_data'

      const row: any =
        docType === 'form16'
          ? {
              user_id: userId,
              ...extracted,
              raw_text: text,
              parsed_data: extracted,
              file_path: fileName,
              created_at: new Date().toISOString(),
            }
          : {
              user_id: userId,
              pan: (extracted as any).pan,
              tds_entries: (extracted as any).tds_entries,
              total_tds: (extracted as any).total_tds,
              raw_text: text,
              parsed_data: extracted,
              file_path: fileName,
              created_at: new Date().toISOString(),
            }

      const { error: dbError } = await (supabase.from(table) as any)
        .upsert(row, { onConflict: 'user_id' })

      if (dbError) {
        console.error('[parse-form16] DB upsert error:', dbError.message)
        return res.status(500).json({
          error: 'File uploaded but could not save extracted data',
          fields: extracted,
        })
      }

      return res.status(200).json({ success: true, fields: extracted })
    } catch (e: any) {
      console.error('[parse-form16] Unexpected error:', e.message)
      return res.status(500).json({ error: 'Could not process this file. It may be corrupted or password-protected.' })
    }
  })
}
