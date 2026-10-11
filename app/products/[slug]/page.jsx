import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProductDetailClient from '@/components/products/ProductDetailClient';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product) return { title: 'Product Not Found - ThreadCraft' };

  return {
    title: `${product.name} | ThreadCraft Luxury Menswear`,
    description: product.description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.substring(0, 160),
      images: product.images?.[0]?.url ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      collection: true,
      images: { orderBy: { displayOrder: 'asc' } },
      variants: { orderBy: { sku: 'asc' } },
    },
  });

  if (!product || !product.isPublished) {
    notFound();
  }

  // Related products
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isPublished: true,
    },
    take: 3,
    include: {
      images: { take: 1 },
    },
  });

  return (
    <div className="bg-white min-h-screen">
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
    </div>
  );
}
