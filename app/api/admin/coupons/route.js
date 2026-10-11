import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ coupons });
  } catch (err) {
    if (err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    const { code, discountType, discountValue, minOrderValue, maxDiscount } = await req.json();

    if (!code || !discountValue) {
      return NextResponse.json({ error: 'Code and discount value required' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        discountType: discountType || 'PERCENTAGE',
        discountValue: parseInt(discountValue, 10),
        minOrderValue: parseInt(minOrderValue, 10) || 0,
        maxDiscount: maxDiscount ? parseInt(maxDiscount, 10) : null,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'COUPON_CREATED',
        entity: 'COUPON',
        entityId: coupon.id,
        details: JSON.stringify({ code: coupon.code, discountValue }),
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (err) {
    if (err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Failed to create coupon' }, { status: 500 });
  }
}
