import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, getOrCreateGuestSession } from '@/lib/auth';
import { calculateCartTotals } from '@/lib/pricing';
import { createRazorpayOrder } from '@/lib/payments/razorpay';
import { createOrderSchema } from '@/lib/validation/schemas';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
            customDesign: true,
          },
        },
        payments: true,
        shipments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error('Fetch orders error:', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const result = createOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid checkout information' },
        { status: 400 }
      );
    }

    const user = await getSessionUser();
    const guestToken = await getOrCreateGuestSession();
    const { shippingAddress, couponCode, notes } = result.data;

    // Find Cart
    let cart = null;
    if (user) {
      cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              variant: { include: { product: true } },
              customDesign: true,
            },
          },
        },
      });
    } else {
      cart = await prisma.cart.findUnique({
        where: { sessionToken: guestToken },
        include: {
          items: {
            include: {
              variant: { include: { product: true } },
              customDesign: true,
            },
          },
        },
      });
    }

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
    }

    // Verify coupon if provided
    let appliedCoupon = null;
    if (couponCode) {
      appliedCoupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });
      if (!appliedCoupon || !appliedCoupon.isActive) {
        appliedCoupon = null;
      }
    }

    // Calculate authoritative totals
    const totals = calculateCartTotals(cart.items, appliedCoupon);

    // Verify inventory concurrency in a transaction
    const orderNumber = `TC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const createdOrder = await prisma.$transaction(async (tx) => {
      // 1. Verify and deduct stock for each variant
      for (const item of cart.items) {
        const freshVariant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (!freshVariant || freshVariant.stock < item.quantity) {
          throw new Error(
            `Item ${item.variant.product.name} (${freshVariant?.sku || 'variant'}) is out of stock or has insufficient quantity.`
          );
        }

        // Deduct stock
        await tx.productVariant.update({
          where: { id: freshVariant.id },
          data: { stock: freshVariant.stock - item.quantity },
        });

        // Record inventory movement
        await tx.inventoryMovement.create({
          data: {
            variantId: freshVariant.id,
            changeAmount: -item.quantity,
            reason: 'SALE',
            referenceId: orderNumber,
          },
        });
      }

      // 2. Determine initial status: if custom designs exist, require DESIGN_REVIEW once paid
      const hasCustomItems = cart.items.some((i) => Boolean(i.customDesignId));

      // 3. Create the Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id || null,
          guestEmail: user?.email || shippingAddress.email || null,
          status: 'PENDING_PAYMENT',
          totalAmount: totals.finalTotal,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          shippingFee: totals.shippingFee,
          taxAmount: totals.taxAmount,
          couponCode: appliedCoupon?.code || null,
          shippingAddress: JSON.stringify(shippingAddress),
          notes: notes || null,
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              customDesignId: item.customDesignId || null,
              productName: item.variant.product.name,
              variantDetails: JSON.stringify({
                size: item.variant.size,
                colorName: item.variant.colorName,
                colorHex: item.variant.colorHex,
                fit: item.variant.fit,
                sku: item.variant.sku,
              }),
              customDesignSnapshot: item.customDesign
                ? JSON.stringify({
                    placement: item.customDesign.placement,
                    shirtColorHex: item.customDesign.shirtColorHex,
                    shirtColorName: item.customDesign.shirtColorName,
                    textConfig: item.customDesign.textConfig,
                    canvasState: item.customDesign.canvasState,
                    previewUrl: item.customDesign.previewUrl,
                  })
                : null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              customizationFee: item.customizationFee,
              totalPrice: (item.unitPrice + item.customizationFee) * item.quantity,
            })),
          },
        },
      });

      // 4. Update coupon usage count if used
      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // 5. Clear cart items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // 6. Create Razorpay order on server
    const razorpayData = await createRazorpayOrder({
      amountInINR: createdOrder.totalAmount,
      receipt: createdOrder.orderNumber,
      notes: {
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
      },
    });

    // 7. Create pending Payment record
    await prisma.payment.create({
      data: {
        orderId: createdOrder.id,
        paymentMethod: 'RAZORPAY',
        status: 'PENDING',
        amount: createdOrder.totalAmount,
        currency: 'INR',
        razorpayOrderId: razorpayData.orderId,
      },
    });

    return NextResponse.json({
      success: true,
      order: createdOrder,
      razorpayOrder: razorpayData,
    });
  } catch (err) {
    console.error('Order creation error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to place order' },
      { status: 400 }
    );
  }
}
