import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProductCard from '@/components/products/ProductCard';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const collection = await prisma.collection.findUnique({
    where: { slug },
  });

  if (!collection) return { title: 'Collection Not Found - ThreadCraft' };

  return {
    title: `${collection.name} Collection | ThreadCraft`,
    description: collection.description || 'Curated luxury menswear and custom shirt pieces.',
  };
}

export default async function CollectionPage({ params }) {
  const { slug } = await params;

  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isPublished: true },
        include: {
          category: true,
          images: { orderBy: { displayOrder: 'asc' } },
          variants: true,
        },
      },
    },
  });

  if (!collection) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 sm:p-14 mb-10 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
            Curated Collection
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white">
            {collection.name}
          </h1>
          <p className="text-sm text-slate-300 font-light leading-relaxed">
            {collection.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {collection.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
