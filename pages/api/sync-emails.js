import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req, res) {
  try {
    const client = new ImapFlow({
      host: process.env.IMAP_HOST,
      port: Number(process.env.IMAP_PORT || 993),
      secure: true,
      auth: {
        user: process.env.IMAP_USER,
        pass: process.env.IMAP_PASSWORD,
      },
    });

    await client.connect();
    await client.mailboxOpen('INBOX');
   

    let imported = 0;

    for await (const msg of client.fetch('1:*', {
      envelope: true,
      source: true,
    })) {
      const parsed = await simpleParser(msg.source);

      const messageId = parsed.messageId || null;

      // Skip duplicates
      if (messageId) {
        const { data: existing } = await supabaseAdmin
          .from('messages')
          .select('id')
          .eq('message_id', messageId)
          .maybeSingle();

        if (existing) continue;
      }

      const fromEmail =
        parsed.from?.value?.[0]?.address?.toLowerCase() || null;

      if (!fromEmail) continue;

      // Find matching case
      const { data: caseRow } = await supabaseAdmin
  .from('cases')
  .select('id')
  .ilike('client_email', fromEmail)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

      if (!caseRow) continue;

      await supabaseAdmin.from('messages').insert({
        case_id: caseRow.id,
        sender_id: null,
        recipient_email: process.env.IMAP_USER,
        from_email: fromEmail,
        subject: parsed.subject || '(No Subject)',
        body: parsed.text || '',
        direction: 'incoming',
        external_id: null,
        message_id: messageId,
        received_at: parsed.date || new Date(),
      });

      imported++;
    }
    

    await client.logout();

    return res.status(200).json({
      success: true,
      imported,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
