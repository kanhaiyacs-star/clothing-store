import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(req) {
  try {
    const admin = await requireAdmin();
    const { variantId, stockDelta, newStock, reason } = await req.json();

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 });
    }

    const currentVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!currentVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    let finalStock = currentVariant.stock;
    let changeAmount = 0;

    if (newStock !== undefined) {
      changeAmount = newStock - currentVariant.stock;
      finalStock = Math.max(0, newStock);
    } else if (stockDelta !== undefined) {
      changeAmount = stockDelta;
      finalStock = Math.max(0, currentVariant.stock + stockDelta);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: finalStock },
      });

      await tx.inventoryMovement.create({
        data: {
          variantId,
          changeAmount,
          reason: reason || 'MANUAL_ADMIN_ADJUSTMENT',
          referenceId: `admin_${admin.id}`,
        },
      });

      return variant;
    });

    return NextResponse.json({ success: true, variant: updated });
  } catch (err) {
    if (err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    console.error('Inventory adjustment error:', err);
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
  }
}
