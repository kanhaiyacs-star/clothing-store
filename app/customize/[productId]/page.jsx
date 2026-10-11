import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CustomizerStudio from '@/components/customization/CustomizerStudio';

export async function generateMetadata({ params }) {
  const { productId } = await params;
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }],
    },
  });

  if (!product) return { title: 'Product Not Found - ThreadCraft' };

  return {
    title: `Custom Design Studio: ${product.name} | ThreadCraft`,
    description: `Personalize ${product.name} with custom monograms, text, and logos in the ThreadCraft 2D Studio.`,
  };
}

export default async function CustomizePage({ params }) {
  const { productId } = await params;

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }],
    },
    include: {
      category: true,
      collection: true,
      images: { orderBy: { displayOrder: 'asc' } },
      variants: { orderBy: { sku: 'asc' } },
    },
  });

  if (!product) {
    notFound();
  }

  if (!product.isCustomizable) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
          Product Not Eligible for Customization
        </h2>
        <p className="text-slate-600 mb-6">
          {product.name} is a ready-to-wear piece and does not support custom text or logos.
        </p>
        <a
          href="/products"
          className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl font-medium text-sm"
        >
          Explore Customizable Products
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <CustomizerStudio product={product} />
    </div>
  );
}
