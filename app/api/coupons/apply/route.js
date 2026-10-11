import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { applyCouponSchema } from '@/lib/validation/schemas';

export async function POST(req) {
  try {
    const body = await req.json();
    const result = applyCouponSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid coupon code format' }, { status: 400 });
    }

    const { code } = result.data;
    const cartTotal = Number(body.cartTotal) || 0;

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: 'Coupon code is invalid or has expired' }, { status: 404 });
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json({ error: 'This coupon code has expired' }, { status: 400 });
    }

    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
      return NextResponse.json({ error: 'This coupon has reached its maximum usage limit' }, { status: 400 });
    }

    if (cartTotal < coupon.minOrderValue) {
      return NextResponse.json(
        { error: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.` },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((cartTotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === 'FIXED') {
      discountAmount = Math.min(coupon.discountValue, cartTotal);
    }

    return NextResponse.json({
      valid: true,
      message: `Coupon ${coupon.code} applied! Saved ₹${discountAmount}`,
      discountAmount,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        minOrderValue: coupon.minOrderValue,
      },
    });
  } catch (err) {
    console.error('Coupon verification error:', err);
    return NextResponse.json({ error: 'Failed to verify coupon' }, { status: 500 });
  }
}
