import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();

    const products = await prisma.product.findMany({
      include: {
        category: true,
        collection: true,
        images: true,
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (err) {
    if (err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    console.error('Admin products fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    const data = await req.json();

    const {
      name,
      slug,
      description,
      categoryId,
      collectionId,
      sku,
      basePrice,
      salePrice,
      fabric,
      careInstructions,
      isCustomizable,
      imageUrl,
      variants,
    } = data;

    if (!name || !slug || !categoryId || !sku || !basePrice) {
      return NextResponse.json({ error: 'Required product fields missing' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || '',
        categoryId,
        collectionId: collectionId || null,
        sku,
        basePrice: parseInt(basePrice, 10),
        salePrice: salePrice ? parseInt(salePrice, 10) : null,
        fabric: fabric || null,
        careInstructions: careInstructions || null,
        isCustomizable: Boolean(isCustomizable),
        images: imageUrl
          ? {
              create: [
                {
                  url: imageUrl,
                  altText: name,
                  isPrimary: true,
                },
              ],
            }
          : undefined,
        variants: variants && variants.length > 0
          ? {
              create: variants.map((v) => ({
                sku: v.sku,
                colorName: v.colorName,
                colorHex: v.colorHex || '#000000',
                size: v.size,
                fit: v.fit || 'Regular Fit',
                stock: parseInt(v.stock, 10) || 0,
                priceAdjustment: parseInt(v.priceAdjustment, 10) || 0,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        variants: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'PRODUCT_CREATED',
        entity: 'PRODUCT',
        entityId: product.id,
        details: JSON.stringify({ name, sku, basePrice }),
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (err) {
    if (err.message.includes('FORBIDDEN') || err.message.includes('UNAUTHORIZED')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    console.error('Admin create product error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
}
