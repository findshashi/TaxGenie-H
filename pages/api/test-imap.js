import { ImapFlow } from 'imapflow';

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

    const mailbox = await client.mailboxOpen('INBOX');

    await client.logout();

    return res.status(200).json({
      success: true,
      mailboxExists: mailbox.exists,
      message: 'IMAP connection successful'
    });
  } catch (error) {
    console.error('IMAP Error:', error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
