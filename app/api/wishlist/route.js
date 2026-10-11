import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ wishlist: [] });
    }

    const items = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            images: true,
          },
        },
      },
    });

    return NextResponse.json({ wishlist: items });
  } catch (err) {
    console.error('Wishlist fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to save items to your wishlist' }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, isWishlisted: false, message: 'Removed from wishlist' });
    } else {
      await prisma.wishlistItem.create({
        data: {
          userId: user.id,
          productId,
        },
      });
      return NextResponse.json({ success: true, isWishlisted: true, message: 'Added to wishlist' });
    }
  } catch (err) {
    console.error('Wishlist toggle error:', err);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}
