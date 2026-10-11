'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { formatINR } from '@/lib/pricing';
import { 
  Sparkles, 
  ShoppingBag, 
  Heart, 
  Truck, 
  ShieldCheck, 
  RefreshCw, 
  Check, 
  Ruler,
  Info
} from 'lucide-react';

export default function ProductDetailClient({ product, relatedProducts = [] }) {
  const router = useRouter();
  const { addToCart, wishlist, toggleWishlist } = useStore();

  const isWishlisted = wishlist?.some((item) => item.productId === product.id);

  // Images
  const images = product.images?.length > 0
    ? product.images
    : [{ id: '1', url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80', altText: product.name }];

  const [activeImage, setActiveImage] = useState(images[0]?.url);

  // Variants
  const variants = product.variants || [];
  const fits = Array.from(new Set(variants.map((v) => v.fit)));
  const colors = Array.from(new Set(variants.map((v) => v.colorName)));

  const [selectedFit, setSelectedFit] = useState(fits[0] || 'Regular Fit');
  const [selectedColor, setSelectedColor] = useState(colors[0] || 'Crisp White');

  // Find available sizes for selected fit & color
  const matchingVariants = variants.filter(
    (v) => v.fit === selectedFit && v.colorName === selectedColor
  );

  const [selectedSize, setSelectedSize] = useState(
    matchingVariants[0]?.size || 'M'
  );

  const currentVariant = variants.find(
    (v) => v.fit === selectedFit && v.colorName === selectedColor && v.size === selectedSize
  );

  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const unitPrice = (product.salePrice ?? product.basePrice) + (currentVariant?.priceAdjustment ?? 0);
  const isOutOfStock = !currentVariant || currentVariant.stock <= 0;

  const handleAddToCart = async () => {
    if (!currentVariant || isOutOfStock) return;

    setAddingToCart(true);
    const res = await addToCart({
      variantId: currentVariant.id,
      quantity,
    });
    setAddingToCart(false);

    if (res.success) {
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 3000);
    } else {
      alert(res.error || 'Failed to add item to bag');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-400 mb-6">
        <Link href="/" className="hover:text-slate-900">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-slate-900">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Image Gallery (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />

            {product.isCustomizable && (
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Customizable Shirt</span>
                </span>
              </div>
            )}

            <button
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-4 right-4 p-2.5 bg-white/90 hover:bg-white text-slate-700 hover:text-rose-500 rounded-full shadow-md backdrop-blur-sm transition-all"
            >
              <Heart
                className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`}
              />
            </button>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center space-x-3 overflow-x-auto pb-2">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.url)}
                  className={`w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeImage === img.url
                      ? 'border-amber-600 ring-2 ring-amber-100'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.altText || ''} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Details & Purchase Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
              {product.category?.name || 'Menswear'} • SKU: {product.sku}
            </p>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mt-1.5">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mt-3 flex items-baseline space-x-3">
              <span className="text-2xl font-bold font-serif text-slate-900">
                {formatINR(unitPrice)}
              </span>
              {product.salePrice && (
                <span className="text-base text-slate-400 line-through">
                  {formatINR(product.basePrice)}
                </span>
              )}
              {product.salePrice && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-xs rounded">
                  Save {Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)}%
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            {product.description}
          </p>

          {/* 1. Fit Selector */}
          {fits.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Fit Silhouette
              </label>
              <div className="flex flex-wrap gap-2">
                {fits.map((fit) => (
                  <button
                    key={fit}
                    onClick={() => setSelectedFit(fit)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      selectedFit === fit
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Color Selector */}
          {colors.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Fabric Color: <span className="font-semibold text-amber-600">{selectedColor}</span>
                </label>
              </div>
              <div className="flex items-center space-x-3">
                {colors.map((cName) => {
                  const variant = variants.find((v) => v.colorName === cName);
                  const isSelected = selectedColor === cName;
                  return (
                    <button
                      key={cName}
                      onClick={() => setSelectedColor(cName)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        isSelected ? 'ring-2 ring-amber-500 scale-110 border-white' : 'border-slate-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: variant?.colorHex || '#FFF' }}
                      title={cName}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Size Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold uppercase tracking-wider text-slate-900">
                Size
              </label>
              <span className="text-slate-500 font-medium">
                {currentVariant ? `${currentVariant.stock} left in stock` : 'Select size'}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => {
                const match = matchingVariants.find((v) => v.size === sz);
                const isAvailable = match && match.stock > 0;
                const isSelected = selectedSize === sz;

                return (
                  <button
                    key={sz}
                    disabled={!isAvailable}
                    onClick={() => setSelectedSize(sz)}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-200'
                        : isAvailable
                        ? 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                        : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* Customizer CTA if customizable */}
            {product.isCustomizable && (
              <Link
                href={`/customize/${product.slug}`}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 border border-amber-400"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Personalize with Text & Logo Studio</span>
              </Link>
            )}

            {/* Standard Add to Cart Button */}
            <div className="flex items-center space-x-3">
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="py-3.5 px-3 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((q) => (
                  <option key={q} value={q}>
                    Qty: {q}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingToCart}
                className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isOutOfStock
                    ? 'Out of Stock'
                    : addingToCart
                    ? 'Adding to Bag...'
                    : 'Add Ready-to-Wear to Bag'}
                </span>
              </button>
            </div>

            {cartSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
                <span className="font-semibold flex items-center">
                  <Check className="w-4 h-4 mr-1.5" /> Added to your shopping bag!
                </span>
                <Link href="/cart" className="underline font-bold">
                  View Bag →
                </Link>
              </div>
            )}
          </div>

          {/* Delivery & Care Guarantees */}
          <div className="border-t border-slate-200 pt-6 space-y-3 text-xs text-slate-600">
            <div className="flex items-center space-x-3">
              <Truck className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Complimentary shipping on orders above ₹999. Pan-India dispatch in 24-48 hours.</span>
            </div>
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Hassle-free 7-day size exchange guarantee.</span>
            </div>
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Authentic 100% Egyptian Giza / Californian Supima cotton.</span>
            </div>
          </div>

          {/* Tabs for Fabric Details & Care Instructions */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Fabric & Tailoring
              </button>
              <button
                onClick={() => setActiveTab('care')}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === 'care'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Care Instructions
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              {activeTab === 'details' ? (
                <div>
                  <p className="font-semibold text-slate-800">
                    Composition: {product.fabric || '100% Premium Cotton'}
                  </p>
                  <p className="mt-1">
                    Features high-density stitching, reinforced gussets, and precision-fused interlinings that hold their crisp silhouette through extensive wear.
                  </p>
                </div>
              ) : (
                <div>
                  <p>{product.careInstructions || 'Machine wash cold with like colors. Line dry in shade. Warm iron while slightly damp.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 pt-12 border-t border-slate-200">
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">
            You May Also Admire
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <div key={rel.id} className="border border-slate-200 rounded-2xl p-4 bg-white flex space-x-4 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={rel.images?.[0]?.url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80'}
                  alt={rel.name}
                  className="w-16 h-20 object-cover rounded-xl"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{rel.name}</h4>
                  <p className="text-xs text-amber-600 font-semibold mt-0.5">
                    {formatINR(rel.salePrice ?? rel.basePrice)}
                  </p>
                  <Link
                    href={`/products/${rel.slug}`}
                    className="text-[11px] text-slate-500 hover:text-slate-900 underline mt-1 block"
                  >
                    View Product →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
