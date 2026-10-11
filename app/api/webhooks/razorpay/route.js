import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/payments/razorpay';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventId = event?.event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Check for duplicate webhook event (idempotency)
    const existingEvent = await prisma.paymentWebhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      return NextResponse.json({ message: 'Event already processed' }, { status: 200 });
    }

    // Record webhook event in DB
    await prisma.paymentWebhookEvent.create({
      data: {
        eventId,
        eventType: event.event || 'unknown',
        payload: rawBody,
      },
    });

    const eventType = event.event;
    const paymentEntity = event?.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;

    if (razorpayOrderId) {
      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId },
        include: { order: { include: { items: true } } },
      });

      if (payment) {
        if (eventType === 'payment.captured' && payment.status !== 'CAPTURED') {
          const hasCustom = payment.order.items.some((i) => Boolean(i.customDesignId));
          const targetStatus = hasCustom ? 'DESIGN_REVIEW' : 'PAID';

          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: targetStatus },
          });

          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'CAPTURED',
              razorpayPaymentId: paymentEntity.id,
            },
          });
        } else if (eventType === 'payment.failed') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' },
          });
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
