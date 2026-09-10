import { env } from '@/lib/env';

export interface CreatePaymentLinkParams {
  amount: number;
  invoiceId: string;
  invoiceNumber?: string;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  description?: string;
}

export interface PaymentLinkResult {
  success: boolean;
  paymentLinkId: string;
  paymentUrl: string;
  amount: number;
  currency: string;
  status: 'created' | 'mocked';
  configured: boolean;
  error?: string;
}

/**
 * Online Payment Gateway Integration (Razorpay / Stripe Placeholder)
 * Generates payment collection links for invoices.
 * When RAZORPAY credentials are provided, connects to payment provider API.
 * In development or when unconfigured, logs and returns a mock payment link.
 */
export async function createPaymentLink({
  amount,
  invoiceId,
  invoiceNumber,
  currency = 'INR',
  customerName,
  customerEmail,
  description,
}: CreatePaymentLinkParams): Promise<PaymentLinkResult> {
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const mockId = `plink_mock_${Date.now()}`;
    const mockUrl = `https://checkout.razorpay.com/v1/mock/pay_${invoiceId}`;

    console.log(
      `\n[PAYMENT GATEWAY - NOT CONFIGURED]\n  Invoice: ${invoiceNumber || invoiceId}\n  Amount: ${currency} ${amount.toLocaleString('en-IN')}\n  Customer: ${customerName || 'N/A'} (${customerEmail || 'N/A'})\n  Generated Mock Link: ${mockUrl}\n`
    );

    return {
      success: true,
      paymentLinkId: mockId,
      paymentUrl: mockUrl,
      amount,
      currency,
      status: 'mocked',
      configured: false,
    };
  }

  try {
    // Production Razorpay Payment Links API integration point:
    // POST https://api.razorpay.com/v1/payment_links
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Amount in paise
        currency,
        accept_partial: false,
        reference_id: invoiceNumber || invoiceId,
        description: description || `Payment for Invoice ${invoiceNumber || invoiceId}`,
        customer: {
          name: customerName || 'Client',
          email: customerEmail,
        },
        notify: {
          sms: false,
          email: Boolean(customerEmail),
        },
        reminder_enable: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[PAYMENT GATEWAY - RAZORPAY ERROR]', errorData);
      return {
        success: false,
        paymentLinkId: '',
        paymentUrl: '',
        amount,
        currency,
        status: 'mocked',
        configured: true,
        error: `Razorpay API returned ${response.status}: ${errorData}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      paymentLinkId: data.id,
      paymentUrl: data.short_url,
      amount,
      currency,
      status: 'created',
      configured: true,
    };
  } catch (err) {
    console.error('[PAYMENT GATEWAY - LINK CREATION FAILED]', err);
    return {
      success: false,
      paymentLinkId: '',
      paymentUrl: '',
      amount,
      currency,
      status: 'mocked',
      configured: true,
      error: err instanceof Error ? err.message : 'Unknown payment gateway error',
    };
  }
}
