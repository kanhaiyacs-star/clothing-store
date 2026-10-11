import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();

    // 1. Total paid revenue
    const paidOrders = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'PROCESSING', 'DESIGN_REVIEW', 'READY_FOR_SHIPMENT', 'SHIPPED', 'DELIVERED'] },
      },
      select: { totalAmount: true },
    });
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // 2. Total orders count
    const totalOrdersCount = await prisma.order.count();

    // 3. Total customers
    const totalCustomersCount = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    // 4. Low stock variants count (< 10)
    const lowStockCount = await prisma.productVariant.count({
      where: { stock: { lt: 10 } },
    });

    // 5. Recent 5 orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        items: true,
      },
    });

    // 6. Orders pending design review
    const pendingDesignReviewCount = await prisma.order.count({
      where: { status: 'DESIGN_REVIEW' },
    });

    return NextResponse.json({
      stats: {
        totalRevenue,
        totalOrdersCount,
        totalCustomersCount,
        lowStockCount,
        pendingDesignReviewCount,
      },
      recentOrders,
    });
  } catch (err) {
    if (err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    console.error('Admin stats fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
