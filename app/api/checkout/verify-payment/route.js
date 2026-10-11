import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyRazorpaySignature } from '@/lib/payments/razorpay';
import { sendTransactionalEmail } from '@/lib/email';
import { verifyPaymentSchema } from '@/lib/validation/schemas';

export async function POST(req) {
  try {
    const body = await req.json();
    const result = verifyPaymentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payment parameters' }, { status: 400 });
    }

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = result.data;

    // Verify signature
    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Payment verification failed: Invalid Razorpay cryptographic signature' },
        { status: 400 }
      );
    }

    // Fetch order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Determine target status
    const hasCustomItems = order.items.some((i) => Boolean(i.customDesignId));
    const nextStatus = hasCustomItems ? 'DESIGN_REVIEW' : 'PAID';

    // Update Order and Payment within a transaction
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: nextStatus },
      });

      // Update or create payment record
      await tx.payment.upsert({
        where: { razorpayOrderId },
        update: {
          status: 'CAPTURED',
          razorpayPaymentId,
          razorpaySignature,
        },
        create: {
          orderId: order.id,
          paymentMethod: 'RAZORPAY',
          status: 'CAPTURED',
          amount: order.totalAmount,
          currency: 'INR',
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        },
      });

      // Add audit log
      await tx.auditLog.create({
        data: {
          userId: order.userId,
          action: 'PAYMENT_VERIFIED',
          entity: 'ORDER',
          entityId: order.id,
          details: JSON.stringify({
            orderNumber: order.orderNumber,
            amount: order.totalAmount,
            razorpayPaymentId,
            status: nextStatus,
          }),
        },
      });
    });

    // Send order confirmation email
    const recipientEmail = order.user?.email || order.guestEmail;
    if (recipientEmail) {
      await sendTransactionalEmail({
        to: recipientEmail,
        subject: `Order Confirmed: ${order.orderNumber} - ThreadCraft`,
        htmlText: `
          <h2>Thank you for your order, ${order.user?.name || 'Valued Customer'}!</h2>
          <p>Your order <strong>${order.orderNumber}</strong> has been successfully placed and payment verified.</p>
          <p>Total Paid: ₹${order.totalAmount}</p>
          <p>Status: ${nextStatus === 'DESIGN_REVIEW' ? 'Under Custom Design Review by Master Tailor' : 'Payment Confirmed / In Production'}</p>
          <p>Track your order anytime at ThreadCraft.</p>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order confirmed',
      orderNumber: order.orderNumber,
      status: nextStatus,
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    return NextResponse.json({ error: 'Failed to process payment confirmation' }, { status: 500 });
  }
}
