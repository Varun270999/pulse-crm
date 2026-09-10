import { env } from '@/lib/env';

export interface SendSmsParams {
  to: string;
  message: string;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  configured: boolean;
  error?: string;
}

/**
 * SMS Gateway Service (Twilio Placeholder)
 * When TWILIO credentials are provided, connects to Twilio API.
 * In development or when unconfigured, logs SMS content with [SMS - NOT CONFIGURED] prefix.
 */
export async function sendSms({ to, message }: SendSmsParams): Promise<SendSmsResult> {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const fromNumber = env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log(`\n[SMS - NOT CONFIGURED]\n  To: ${to}\n  From: ${fromNumber || 'UNCONFIGURED'}\n  Message: ${message}\n`);
    return {
      success: true,
      messageId: `mock-sms-${Date.now()}`,
      configured: false,
    };
  }

  try {
    // Production Twilio REST API integration point
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams({
      To: to,
      From: fromNumber,
      Body: message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SMS - TWILIO API ERROR]', errorText);
      return {
        success: false,
        configured: true,
        error: `Twilio API returned ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.sid,
      configured: true,
    };
  } catch (err) {
    console.error('[SMS - DELIVERY FAILED]', err);
    return {
      success: false,
      configured: true,
      error: err instanceof Error ? err.message : 'Unknown SMS transport error',
    };
  }
}
