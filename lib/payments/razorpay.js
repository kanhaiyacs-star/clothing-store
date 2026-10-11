import crypto from 'crypto';
import Razorpay from 'razorpay';

const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder';
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_whsec_placeholder';

export const isRazorpayConfigured = Boolean(
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET &&
  !process.env.RAZORPAY_KEY_ID.includes('placeholder')
);

export function getRazorpayClient() {
  if (!isRazorpayConfigured) {
    return null;
  }
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Creates an order in Razorpay (or mock in sandbox if credentials unconfigured)
 */
export async function createRazorpayOrder({ amountInINR, receipt, notes = {} }) {
  const amountInPaise = Math.round(amountInINR * 100);

  if (isRazorpayConfigured) {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt.substring(0, 40),
      notes,
    });
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      isLive: true,
    };
  }

  // Development Sandbox order generator
  const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  return {
    orderId: mockOrderId,
    amount: amountInPaise,
    currency: 'INR',
    isLive: false,
    keyId: keyId,
  };
}

/**
 * Verifies Razorpay payment signature
 */
export function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  // If in mock sandbox dev mode with explicit mock prefix
  if (!isRazorpayConfigured && razorpaySignature.startsWith('mock_sig_')) {
    return true;
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
}

/**
 * Verifies Razorpay Webhook signature against raw request body
 */
export function verifyWebhookSignature(rawBody, signature) {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}
