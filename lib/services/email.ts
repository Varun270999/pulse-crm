import { env } from '@/lib/env';

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  configured: boolean;
  error?: string;
}

/**
 * Transactional Email Service
 * Uses Resend API when RESEND_API_KEY is provided in environment variables.
 * In development or when unconfigured, cleanly logs email content with [EMAIL - NOT CONFIGURED] prefix.
 */
export async function sendEmail({
  to,
  subject,
  body,
  html,
}: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = env.RESEND_API_KEY;
  const fromAddress = env.EMAIL_FROM || 'Pulse CRM <noreply@pulsecrm.local>';

  if (!apiKey) {
    console.log(
      `\n[EMAIL - NOT CONFIGURED]\n  To: ${to}\n  From: ${fromAddress}\n  Subject: ${subject}\n  Body: ${body}\n`
    );
    return {
      success: true,
      messageId: `mock-email-${Date.now()}`,
      configured: false,
    };
  }

  try {
    // When real credentials exist: call Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        text: body,
        html: html || `<p>${body.replace(/\n/g, '<br/>')}</p>`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[EMAIL - RESEND API ERROR]', errorText);
      return {
        success: false,
        configured: true,
        error: `Resend API returned ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
      configured: true,
    };
  } catch (err) {
    console.error('[EMAIL - DELIVERY FAILED]', err);
    return {
      success: false,
      configured: true,
      error: err instanceof Error ? err.message : 'Unknown email transport error',
    };
  }
}
