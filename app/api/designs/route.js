import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { customDesignSchema } from '@/lib/validation/schemas';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ designs: [] });
    }

    const designs = await prisma.customDesign.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: { images: true },
        },
        logoAsset: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ designs });
  } catch (err) {
    console.error('Fetch designs error:', err);
    return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const result = customDesignSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid design data' },
        { status: 400 }
      );
    }

    const user = await getSessionUser();
    const {
      productId,
      variantId,
      designName,
      placement,
      shirtColorHex,
      shirtColorName,
      textConfig,
      logoAssetId,
      canvasState,
      previewUrl,
    } = result.data;

    // Verify product exists and is customizable
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.isCustomizable) {
      return NextResponse.json({ error: 'This product is not eligible for customization' }, { status: 400 });
    }

    // Save design
    const design = await prisma.customDesign.create({
      data: {
        userId: user?.id || null,
        productId,
        variantId: variantId || null,
        designName: designName || `${product.name} Customization`,
        placement,
        shirtColorHex,
        shirtColorName,
        textConfig: typeof textConfig === 'object' ? JSON.stringify(textConfig) : textConfig,
        logoAssetId: logoAssetId || null,
        canvasState: typeof canvasState === 'object' ? JSON.stringify(canvasState) : canvasState,
        previewUrl: previewUrl || null,
        version: 1,
      },
      include: {
        product: true,
        logoAsset: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Design saved successfully',
      design,
    });
  } catch (err) {
    console.error('Save design error:', err);
    return NextResponse.json({ error: 'Failed to save custom design' }, { status: 500 });
  }
}
