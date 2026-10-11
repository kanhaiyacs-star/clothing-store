import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyRazorpaySignature, verifyWebhookSignature } from '../lib/payments/razorpay';

describe('Razorpay Signature & Security Verification', () => {
  const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder';
  const orderId = 'order_Nn31e0v9Y4L8';
  const paymentId = 'pay_Nn3217w9k5m9';

  it('rejects missing parameters', () => {
    expect(verifyRazorpaySignature({})).toBe(false);
    expect(verifyRazorpaySignature({ razorpayOrderId: orderId })).toBe(false);
  });

  it('verifies valid HMAC SHA256 payment signature', () => {
    const validSig = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSig,
    });

    expect(isValid).toBe(true);
  });

  it('rejects forged/tampered payment signature', () => {
    const forgedSig = 'forged_fake_signature_abc123';
    const isValid = verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: forgedSig,
    });

    expect(isValid).toBe(false);
  });

  it('verifies webhook raw payload signature', () => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_whsec_placeholder';
    const rawPayload = JSON.stringify({ event: 'payment.captured', entity: { id: paymentId } });

    const validWebhookSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawPayload)
      .digest('hex');

    expect(verifyWebhookSignature(rawPayload, validWebhookSig)).toBe(true);
    expect(verifyWebhookSignature(rawPayload, 'invalid_sig')).toBe(false);
  });
});
