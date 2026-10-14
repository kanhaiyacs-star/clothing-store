const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'orders@threadcraft.in';

export async function sendTransactionalEmail({ to, subject, htmlText }) {
  if (!resendApiKey) {
    console.log(`[EMAIL DEVELOPMENT MOCK] To: ${to} | Subject: "${subject}"`);
    return {
      success: true,
      delivered: false,
      mode: 'mock',
      message: 'Email logged to development console (RESEND_API_KEY not configured)',
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [to],
        subject,
        html: htmlText,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to deliver email');
    }

    return {
      success: true,
      delivered: true,
      id: data.id,
      mode: 'live',
    };
  } catch (err) {
    console.error('Email sending error:', err);
    return {
      success: false,
      delivered: false,
      error: err.message,
    };
  }
}