'use client';

import React from 'react';
import Link from 'next/link';
import { formatINR } from '@/lib/pricing';
import { useStore } from '@/context/StoreContext';
import { Sparkles, Heart } from 'lucide-react';

export default function ProductCard({ product }) {
  const { wishlist, toggleWishlist } = useStore();

  const isWishlisted = wishlist?.some((item) => item.productId === product.id);
  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80';

  const hasSale = product.salePrice && product.salePrice < product.basePrice;

  return (
    <div className="group relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Image Container */}
      <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.isCustomizable && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-500/95 text-slate-950 font-bold text-[10px] uppercase tracking-wider rounded-md backdrop-blur-sm shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span>Customizable</span>
            </span>
          )}
          {hasSale && (
            <span className="inline-block px-2.5 py-1 bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-md shadow-sm">
              Sale
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-slate-700 hover:text-rose-500 rounded-full shadow-md backdrop-blur-sm transition-all"
          aria-label="Toggle wishlist"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-rose-500 text-rose-500' : ''
            }`}
          />
        </button>

        {/* Quick Customize Action on Hover */}
        {product.isCustomizable && (
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 hidden sm:block">
            <Link
              href={`/customize/${product.slug}`}
              className="w-full py-2.5 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl text-center backdrop-blur-md flex items-center justify-center space-x-1.5 shadow-lg transition-transform"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Open Customizer</span>
            </Link>
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {product.category?.name || 'Menswear'}
          </p>
          <h3 className="text-sm font-semibold text-slate-900 mt-1 line-clamp-1 group-hover:text-amber-600 transition-colors">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>
          {product.fabric && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{product.fabric}</p>
          )}
        </div>

        {/* Price & Action */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-base font-bold text-slate-900 font-serif">
              {formatINR(product.salePrice ?? product.basePrice)}
            </span>
            {hasSale && (
              <span className="text-xs text-slate-400 line-through">
                {formatINR(product.basePrice)}
              </span>
            )}
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="text-xs font-semibold text-slate-900 hover:text-amber-600 underline underline-offset-4"
          >
            Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
