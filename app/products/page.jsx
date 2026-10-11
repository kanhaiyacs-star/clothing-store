import prisma from '@/lib/prisma';
import ProductCard from '@/components/products/ProductCard';
import Link from 'next/link';
import { Filter, SlidersHorizontal, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'All Products | ThreadCraft Menswear',
  description: 'Shop luxury formal shirts and streetwear T-shirts with bespoke customization options.',
};

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const categorySlug = params?.category;
  const collectionSlug = params?.collection;
  const searchQuery = params?.search;
  const sort = params?.sort || 'newest';
  const customizableOnly = params?.customizable === 'true';

  // Build where filter
  const where = {
    isPublished: true,
  };

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (collectionSlug) {
    where.collection = { slug: collectionSlug };
  }

  if (customizableOnly) {
    where.isCustomizable = true;
  }

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery } },
      { description: { contains: searchQuery } },
      { fabric: { contains: searchQuery } },
    ];
  }

  // Sorting
  let orderBy = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { basePrice: 'asc' };
  if (sort === 'price_desc') orderBy = { basePrice: 'desc' };

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        collection: true,
        images: { orderBy: { displayOrder: 'asc' } },
        variants: true,
      },
      orderBy,
    }),
    prisma.category.findMany(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Title & Breadcrumbs */}
      <div className="pb-8 border-b border-slate-200">
        <div className="text-xs text-slate-400 mb-2">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">Products</span>
          {categorySlug && (
            <>
              <span className="mx-2">/</span>
              <span className="text-amber-600 capitalize">{categorySlug.replace('-', ' ')}</span>
            </>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">
              {searchQuery
                ? `Search results for "${searchQuery}"`
                : categorySlug === 'formal-shirts'
                ? 'Formal Shirts'
                : categorySlug === 't-shirts'
                ? 'Luxury & Heavyweight T-Shirts'
                : 'All Apparel & Custom Creations'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Showing {products.length} {products.length === 1 ? 'garment' : 'garments'} crafted with high-staple cotton.
            </p>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/products${categorySlug ? `?category=${categorySlug}&` : '?'}customizable=${!customizableOnly}`}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center space-x-1.5 ${
                customizableOnly
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Customizable Only</span>
            </Link>

            {/* Sort links */}
            <div className="flex items-center text-xs space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Link
                href={`/products?${categorySlug ? `category=${categorySlug}&` : ''}sort=newest`}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  sort === 'newest' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Newest
              </Link>
              <Link
                href={`/products?${categorySlug ? `category=${categorySlug}&` : ''}sort=price_asc`}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  sort === 'price_asc' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Price: Low to High
              </Link>
              <Link
                href={`/products?${categorySlug ? `category=${categorySlug}&` : ''}sort=price_desc`}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  sort === 'price_desc' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Price: High to Low
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Pill Navigation */}
      <div className="flex items-center space-x-2 py-4 overflow-x-auto scrollbar-none">
        <Link
          href="/products"
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            !categorySlug
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Categories
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              categorySlug === cat.slug
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 mt-6">
          <p className="text-base font-semibold text-slate-800">No matching products found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
          <Link
            href="/products"
            className="inline-block mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
          >
            Clear All Filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
