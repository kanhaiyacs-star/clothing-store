import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, getOrCreateGuestSession } from '@/lib/auth';
import { calculateCartTotals, calculateCustomizationFee } from '@/lib/pricing';
import { addToCartSchema } from '@/lib/validation/schemas';

async function getOrCreateCart() {
  const user = await getSessionUser();
  const guestToken = await getOrCreateGuestSession();

  let cart = null;

  if (user) {
    // Check if user has an existing cart
    cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: true,
                  },
                },
              },
            },
            customDesign: true,
          },
        },
      },
    });

    // Also check if there was an active guest cart to merge!
    if (guestToken) {
      const guestCart = await prisma.cart.findUnique({
        where: { sessionToken: guestToken },
        include: { items: true },
      });

      if (guestCart && guestCart.items.length > 0) {
        if (!cart) {
          // Transfer guest cart to user
          cart = await prisma.cart.update({
            where: { id: guestCart.id },
            data: { userId: user.id, sessionToken: null },
            include: {
              items: {
                include: {
                  variant: {
                    include: {
                      product: {
                        include: { images: true },
                      },
                    },
                  },
                  customDesign: true,
                },
              },
            },
          });
        } else {
          // Merge items into user's cart
          for (const gItem of guestCart.items) {
            const existingUserItem = cart.items.find(
              (i) => i.variantId === gItem.variantId && i.customDesignId === gItem.customDesignId
            );
            if (existingUserItem) {
              await prisma.cartItem.update({
                where: { id: existingUserItem.id },
                data: { quantity: existingUserItem.quantity + gItem.quantity },
              });
            } else {
              await prisma.cartItem.create({
                data: {
                  cartId: cart.id,
                  variantId: gItem.variantId,
                  customDesignId: gItem.customDesignId,
                  quantity: gItem.quantity,
                  unitPrice: gItem.unitPrice,
                  customizationFee: gItem.customizationFee,
                },
              });
            }
          }
          await prisma.cart.delete({ where: { id: guestCart.id } });
        }
      }
    }

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: { images: true },
                  },
                },
              },
              customDesign: true,
            },
          },
        },
      });
    }
  } else {
    // Guest cart
    cart = await prisma.cart.findUnique({
      where: { sessionToken: guestToken },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: { images: true },
                },
              },
            },
            customDesign: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionToken: guestToken },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: { images: true },
                  },
                },
              },
              customDesign: true,
            },
          },
        },
      });
    }
  }

  // Refetch complete cart with relations
  return await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
        include: {
          variant: {
            include: {
              product: {
                include: { images: true },
              },
            },
          },
          customDesign: true,
        },
      },
    },
  });
}

export async function GET() {
  try {
    const cart = await getOrCreateCart();
    const totals = calculateCartTotals(cart.items);

    return NextResponse.json({
      cart: {
        id: cart.id,
        items: cart.items,
        ...totals,
      },
    });
  } catch (err) {
    console.error('Get cart error:', err);
    return NextResponse.json({ error: 'Failed to retrieve cart' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const result = addToCartSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid item details' },
        { status: 400 }
      );
    }

    const { variantId, customDesignId, quantity } = result.data;

    // Check variant exists and has sufficient stock
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      return NextResponse.json({ error: 'Selected variant not found' }, { status: 404 });
    }

    if (variant.stock < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Only ${variant.stock} left in stock.` },
        { status: 400 }
      );
    }

    let customDesign = null;
    let customFee = 0;

    if (customDesignId) {
      customDesign = await prisma.customDesign.findUnique({
        where: { id: customDesignId },
      });
      if (!customDesign) {
        return NextResponse.json({ error: 'Custom design not found' }, { status: 404 });
      }
      customFee = calculateCustomizationFee(customDesign);
    }

    const cart = await getOrCreateCart();

    const unitPrice = (variant.product.salePrice ?? variant.product.basePrice) + variant.priceAdjustment;

    // Check if this item already exists in the cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        variantId,
        customDesignId: customDesignId || null,
      },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > variant.stock) {
        return NextResponse.json(
          { error: `Cannot add more. Exceeds available stock of ${variant.stock}.` },
          { status: 400 }
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          customDesignId: customDesignId || null,
          quantity,
          unitPrice,
          customizationFee: customFee,
        },
      });
    }

    const updatedCart = await getOrCreateCart();
    const totals = calculateCartTotals(updatedCart.items);

    return NextResponse.json({
      success: true,
      message: 'Item added to cart',
      cart: {
        id: updatedCart.id,
        items: updatedCart.items,
        ...totals,
      },
    });
  } catch (err) {
    console.error('Add to cart error:', err);
    return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
  }
}
