import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, getOrCreateGuestSession } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    const { itemId } = await params;
    const { quantity } = await req.json();

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 });
    }

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        variant: true,
        cart: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    if (quantity > item.variant.stock) {
      return NextResponse.json(
        { error: `Insufficient stock. Only ${item.variant.stock} available.` },
        { status: 400 }
      );
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return NextResponse.json({ success: true, message: 'Quantity updated' });
  } catch (err) {
    console.error('Update cart item error:', err);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { itemId } = await params;

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    console.error('Delete cart item error:', err);
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
  }
}
