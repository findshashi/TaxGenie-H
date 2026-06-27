// lib/pdfParser.js
// Extracts key tax fields from Form 16 and 26AS PDF text
// Used by the upload-document and parse-document API routes

/**
 * Parse raw PDF text and extract Form 16 fields.
 * Returns an object with extracted values, or null for fields not found.
 */
function parseForm16(text) {
  const clean = text.replace(/\s+/g, ' ').trim();

  const extract = (patterns) => {
    for (const pattern of patterns) {
      const match = clean.match(pattern);
      if (match && match[1]) {
        // Remove commas and ₹ symbol, return as number
        const value = match[1].replace(/[,₹\s]/g, '');
        const num = parseFloat(value);
        return isNaN(num) ? match[1].trim() : num;
      }
    }
    return null;
  };

  return {
    documentType: 'form16',
    // ── Income fields ───────────────────────────────────────
    grossSalary: extract([
      /gross\s+salary[:\s₹]*([\d,]+)/i,
      /total\s+salary[:\s₹]*([\d,]+)/i,
      /salary\s+as\s+per\s+provisions[:\s₹]*([\d,]+)/i,
      /1\s*\.\s*Salary.*?[:\s₹]*([\d,]+)/i,
    ]),
    basicSalary: extract([
      /basic\s+salary[:\s₹]*([\d,]+)/i,
      /basic\s+pay[:\s₹]*([\d,]+)/i,
    ]),
    hra: extract([
      /house\s+rent\s+allowance[:\s₹]*([\d,]+)/i,
      /hra[:\s₹]*([\d,]+)/i,
    ]),
    otherAllowances: extract([
      /other\s+allowances[:\s₹]*([\d,]+)/i,
      /special\s+allowance[:\s₹]*([\d,]+)/i,
    ]),
    // ── Deductions ──────────────────────────────────────────
    taxableIncome: extract([
      /taxable\s+income[:\s₹]*([\d,]+)/i,
      /income\s+chargeable\s+to\s+tax[:\s₹]*([\d,]+)/i,
      /total\s+taxable\s+income[:\s₹]*([\d,]+)/i,
    ]),
    standardDeduction: extract([
      /standard\s+deduction[:\s₹]*([\d,]+)/i,
    ]),
    section80C: extract([
      /80\s*c[:\s₹]*([\d,]+)/i,
      /deduction\s+u\/s\s+80c[:\s₹]*([\d,]+)/i,
    ]),
    section80D: extract([
      /80\s*d[:\s₹]*([\d,]+)/i,
      /medical\s+insurance[:\s₹]*([\d,]+)/i,
    ]),
    // ── Tax computed ────────────────────────────────────────
    taxDeducted: extract([
      /tax\s+deducted\s+at\s+source[:\s₹]*([\d,]+)/i,
      /tds\s+deducted[:\s₹]*([\d,]+)/i,
      /total\s+tax\s+deducted[:\s₹]*([\d,]+)/i,
      /tax\s+deducted[:\s₹]*([\d,]+)/i,
    ]),
    totalTaxPayable: extract([
      /total\s+tax\s+payable[:\s₹]*([\d,]+)/i,
      /tax\s+payable[:\s₹]*([\d,]+)/i,
    ]),
    // ── Employer info ───────────────────────────────────────
    employerName: extract([
      /name\s+of\s+employer[:\s]*([A-Za-z0-9\s&.,()-]+?)(?:\n|TAN|PAN|CIN)/i,
      /employer['\s]+name[:\s]*([A-Za-z0-9\s&.,()-]+?)(?:\n|TAN|PAN)/i,
    ]),
    employerPan: extract([
      /(?:employer|deductor)['\s]+pan[:\s]*([A-Z]{5}[0-9]{4}[A-Z]{1})/i,
      /PAN\s+of\s+employer[:\s]*([A-Z]{5}[0-9]{4}[A-Z]{1})/i,
    ]),
    employerTan: extract([
      /TAN[:\s]*([A-Z]{4}[0-9]{5}[A-Z]{1})/i,
    ]),
    // ── Period ──────────────────────────────────────────────
    financialYear: extract([
      /financial\s+year[:\s]*([\d]{4}-[\d]{2,4})/i,
      /F\.?Y\.?[:\s]*([\d]{4}-[\d]{2,4})/i,
      /assessment\s+year[:\s]*([\d]{4}-[\d]{2,4})/i,
    ]),
    // ── Employee info ────────────────────────────────────────
    employeePan: extract([
      /(?:employee|recipient)['\s]+pan[:\s]*([A-Z]{5}[0-9]{4}[A-Z]{1})/i,
      /PAN\s+of\s+(?:employee|recipient)[:\s]*([A-Z]{5}[0-9]{4}[A-Z]{1})/i,
    ]),
    employeeName: extract([
      /name\s+of\s+(?:employee|recipient)[:\s]*([A-Za-z\s]+?)(?:\n|PAN|Father)/i,
    ]),
  };
}

/**
 * Parse raw PDF text and extract 26AS fields.
 */
function parse26AS(text) {
  const clean = text.replace(/\s+/g, ' ').trim();

  const extract = (patterns) => {
    for (const pattern of patterns) {
      const match = clean.match(pattern);
      if (match && match[1]) {
        const value = match[1].replace(/[,₹\s]/g, '');
        const num = parseFloat(value);
        return isNaN(num) ? match[1].trim() : num;
      }
    }
    return null;
  };

  return {
    documentType: '26as',
    // ── TDS / TCS ───────────────────────────────────────────
    totalTaxDeducted: extract([
      /total\s+(?:tax\s+)?deducted[:\s₹]*([\d,]+)/i,
      /total\s+tds[:\s₹]*([\d,]+)/i,
      /tax\s+deducted\s+at\s+source.*?total[:\s₹]*([\d,]+)/i,
    ]),
    tdsOnSalary: extract([
      /tds\s+on\s+salary[:\s₹]*([\d,]+)/i,
      /part\s+a.*?salary[:\s₹]*([\d,]+)/i,
    ]),
    tdsCredits: extract([
      /tds\s+credits[:\s₹]*([\d,]+)/i,
      /total\s+credit[:\s₹]*([\d,]+)/i,
    ]),
    // ── Income fields ───────────────────────────────────────
    interestIncome: extract([
      /interest\s+(?:income|earned)[:\s₹]*([\d,]+)/i,
      /savings\s+(?:account\s+)?interest[:\s₹]*([\d,]+)/i,
    ]),
    dividendIncome: extract([
      /dividend[:\s₹]*([\d,]+)/i,
    ]),
    // ── Tax paid ────────────────────────────────────────────
    advanceTaxPaid: extract([
      /advance\s+tax[:\s₹]*([\d,]+)/i,
    ]),
    selfAssessmentTaxPaid: extract([
      /self[\s-]assessment\s+tax[:\s₹]*([\d,]+)/i,
    ]),
    // ── Taxpayer info ────────────────────────────────────────
    pan: extract([
      /PAN[:\s]*([A-Z]{5}[0-9]{4}[A-Z]{1})/i,
    ]),
    taxpayerName: extract([
      /name[:\s]*([A-Za-z\s]+?)(?:\n|PAN|Address)/i,
    ]),
    financialYear: extract([
      /financial\s+year[:\s]*([\d]{4}-[\d]{2,4})/i,
      /F\.?Y\.?[:\s]*([\d]{4}-[\d]{2,4})/i,
    ]),
  };
}

/**
 * Main entry point: detect document type and parse accordingly.
 * @param {string} text - Raw text extracted from PDF
 * @param {string} docType - 'form16' | '26as' | 'salary_slip' | 'capital_gains' | 'other'
 * @returns {object|null} Extracted data or null if parsing failed
 */
export function parseDocumentText(text, docType) {
  if (!text || text.trim().length < 50) {
    console.warn('[pdfParser] Text too short, skipping extraction');
    return null;
  }

  try {
    switch (docType) {
      case 'form16':
        return parseForm16(text);
      case '26as':
        return parse26AS(text);
      default:
        // Try to auto-detect
        if (/form\s*16|certificate.*tax\s+deducted/i.test(text)) {
          return parseForm16(text);
        }
        if (/26\s*as|annual\s+tax\s+statement|traces/i.test(text)) {
          return parse26AS(text);
        }
        console.log('[pdfParser] Document type unrecognised, skipping extraction');
        return null;
    }
  } catch (err) {
    console.error('[pdfParser] Extraction error:', err.message);
    return null;
  }
}

/**
 * Merge newly extracted data into existing case data.
 * Existing values are preserved unless overwritten.
 */
export function mergeExtractedData(existingData = {}, newData = {}) {
  const merged = { ...existingData };
  for (const [key, value] of Object.entries(newData)) {
    if (value !== null && value !== undefined) {
      merged[key] = value;
    }
  }
  merged.lastUpdated = new Date().toISOString();
  return merged;
}
