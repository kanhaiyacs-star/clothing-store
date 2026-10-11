import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(req) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        items: {
          include: {
            variant: { include: { product: true } },
            customDesign: { include: { logoAsset: true } },
          },
        },
        payments: true,
        shipments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (err) {
    if (err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    console.error('Admin orders fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch admin orders' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const admin = await requireAdmin();
    const { orderId, status, trackingNumber, courierName, notes } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(status ? { status } : {}),
        ...(trackingNumber ? { trackingNumber } : {}),
        ...(courierName ? { courierName } : {}),
        ...(notes ? { notes } : {}),
      },
    });

    // If tracking number provided, upsert Shipment record
    if (trackingNumber && courierName) {
      await prisma.shipment.upsert({
        where: { id: `ship_${orderId}` },
        update: {
          trackingCode: trackingNumber,
          carrier: courierName,
          status: status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT',
        },
        create: {
          id: `ship_${orderId}`,
          orderId,
          trackingCode: trackingNumber,
          carrier: courierName,
          status: 'SHIPPED',
          shippedAt: new Date(),
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'ORDER_UPDATED',
        entity: 'ORDER',
        entityId: orderId,
        details: JSON.stringify({ status, trackingNumber, courierName }),
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    if (err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    console.error('Admin order update error:', err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
