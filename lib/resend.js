// lib/resend.js
// Thin wrapper around the Resend email API.
// Requires RESEND_API_KEY in Vercel environment variables.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@itrgenie.com';

if (!RESEND_API_KEY) {
  console.warn('[resend] RESEND_API_KEY is not set – emails will be skipped');
}

/**
 * Send a plain-text / HTML email via Resend.
 *
 * @param {object} options
 * @param {string}   options.to       - Recipient email address
 * @param {string}   options.subject  - Email subject line
 * @param {string}   options.body     - Plain-text body
 * @param {string}  [options.html]    - Optional HTML body (falls back to body)
 * @param {string}  [options.replyTo] - Optional reply-to address
 * @returns {{ id: string }|null}
 */
export async function sendEmail({ to, subject, body, html, replyTo }) {
  if (!RESEND_API_KEY) {
    console.warn('[resend] Skipping email – no API key configured');
    return { id: 'skipped-no-api-key' };
  }

  const htmlBody = html || buildEmailHtml(body);

  const payload = {
    from: `ITRGenie Support <${SUPPORT_EMAIL}>`,
    to: [to],
    subject,
    html: htmlBody,
    text: body,
    ...(replyTo ? { reply_to: replyTo } : {}),
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message || `Resend API error: ${response.status}`);
  }

  const data = await response.json();
  return { id: data.id };
}

/**
 * Wrap plain-text body in a branded HTML template.
 */
function buildEmailHtml(body) {
  // Convert newlines to <br> for HTML display
  const htmlBody = body.replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ITRGenie</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f7fb; font-family: Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff;
                border-radius: 8px; overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header  { background: linear-gradient(135deg, #38bdf8, #818cf8);
                padding: 24px 32px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; }
    .body    { padding: 32px; color: #374151; font-size: 15px; line-height: 1.7; }
    .footer  { background: #f9fafb; border-top: 1px solid #e5e7eb;
                padding: 16px 32px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>ITRGenie</h1>
    </div>
    <div class="body">
      <p>Dear Client,</p>
      <p>${htmlBody}</p>
      <p style="margin-top:32px">
        Best regards,<br>
        <strong>ITRGenie Support Team</strong>
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} ITRGenie. This email was sent by your assigned tax advisor.
      If you have questions, reply to this email.
    </div>
  </div>
</body>
</html>`;
}
