'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { formatINR, PRICING_RULES } from '@/lib/pricing';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Sparkles, 
  Tag, 
  ArrowRight, 
  Truck, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateCartQuantity, removeFromCart, refreshCart } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const items = cart?.items || [];

  // Calculate pricing with applied coupon
  let subtotal = 0;
  let totalCustomizationFee = 0;

  for (const item of items) {
    const itemPrice = item.unitPrice;
    const customFee = item.customizationFee || 0;
    subtotal += (itemPrice + customFee) * item.quantity;
    totalCustomizationFee += customFee * item.quantity;
  }

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
      if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    } else if (appliedCoupon.discountType === 'FIXED') {
      discountAmount = Math.min(appliedCoupon.discountValue, subtotal);
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingFee =
    discountedSubtotal >= PRICING_RULES.FREE_SHIPPING_THRESHOLD || items.length === 0
      ? 0
      : PRICING_RULES.STANDARD_SHIPPING_FEE;
  const taxAmount = Math.round(discountedSubtotal * PRICING_RULES.GST_TAX_RATE);
  const finalTotal = discountedSubtotal + shippingFee;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setApplyingCoupon(true);
    setCouponError('');

    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          cartTotal: subtotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid coupon');

      setAppliedCoupon(data.coupon);
      setCouponInput('');
    } catch (err) {
      setCouponError(err.message);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleProceedToCheckout = () => {
    // Store coupon code in session storage if active
    if (appliedCoupon) {
      sessionStorage.setItem('threadcraft_coupon', appliedCoupon.code);
    } else {
      sessionStorage.removeItem('threadcraft_coupon');
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
          Your Shopping Bag is Empty
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">
          Explore our handcrafted formal shirts and customizable supima t-shirts to start creating your signature style.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors space-x-2"
        >
          <span>Explore Menswear Collection</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8 pb-4 border-b border-slate-200">
        Shopping Bag ({items.length} {items.length === 1 ? 'Item' : 'Items'})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Cart Items List (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {items.map((item) => {
            const product = item.variant?.product;
            const primaryImg =
              product?.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80';

            const isCustom = Boolean(item.customDesign);
            let textConfig = null;
            if (item.customDesign?.textConfig) {
              try {
                textConfig =
                  typeof item.customDesign.textConfig === 'string'
                    ? JSON.parse(item.customDesign.textConfig)
                    : item.customDesign.textConfig;
              } catch {
                textConfig = null;
              }
            }

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-5"
              >
                {/* Product Thumbnail */}
                <div className="relative w-24 h-32 sm:w-28 sm:h-36 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryImg}
                    alt={product?.name || 'Garment'}
                    className="w-full h-full object-cover"
                  />
                  {isCustom && (
                    <div className="absolute top-1.5 left-1.5">
                      <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 font-bold text-[9px] uppercase tracking-wider rounded">
                        Custom
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {product?.name || 'Garment'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Fit: <span className="font-semibold text-slate-700">{item.variant?.fit}</span> • Size: <span className="font-semibold text-slate-700">{item.variant?.size}</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Color: <span className="font-semibold text-slate-700">{item.variant?.colorName}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove from bag"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Custom Design Badge & Specifications */}
                    {isCustom && (
                      <div className="mt-2.5 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs space-y-1">
                        <div className="flex items-center text-amber-800 font-semibold">
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          <span>Personalized Design Document</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Placement: <span className="font-semibold uppercase">{item.customDesign.placement.replace('_', ' ')}</span>
                        </p>
                        {textConfig?.text && (
                          <p className="text-[11px] text-slate-600">
                            Custom Text: <span className="font-serif font-bold text-slate-900">&quot;{textConfig.text}&quot;</span> ({textConfig.color})
                          </p>
                        )}
                        {item.customDesign.previewUrl && (
                          <p className="text-[11px] text-slate-600">
                            Insignia: <span className="font-semibold text-emerald-700">Logo Print Included</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quantity and Price */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCartQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-900 px-2">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 font-serif">
                        {formatINR((item.unitPrice + (item.customizationFee || 0)) * item.quantity)}
                      </span>
                      {item.customizationFee > 0 && (
                        <p className="text-[10px] text-amber-700">
                          (incl. {formatINR(item.customizationFee * item.quantity)} custom fee)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Order Summary & Coupon (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Coupon Code Input */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Apply Promotion Code</span>
            </h3>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <div className="flex items-center space-x-2 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Coupon {appliedCoupon.code} applied!</span>
                </div>
                <button
                  onClick={() => setAppliedCoupon(null)}
                  className="text-rose-600 hover:underline text-xs font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="e.g. THREAD10"
                  className="flex-1 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  disabled={applyingCoupon || !couponInput.trim()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-colors"
                >
                  {applyingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </form>
            )}

            {couponError && (
              <p className="text-xs text-rose-600 mt-1">{couponError}</p>
            )}

            <div className="text-[11px] text-slate-400">
              Try code: <span className="font-semibold text-slate-700">THREAD10</span> for 10% off or <span className="font-semibold text-slate-700">WELCOME200</span> for ₹200 off.
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Order Summary (INR)
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300 border-b border-slate-800 pb-4">
              <div className="flex justify-between">
                <span>Subtotal ({items.length} items)</span>
                <span>{formatINR(subtotal)}</span>
              </div>

              {totalCustomizationFee > 0 && (
                <div className="flex justify-between text-amber-300">
                  <span>Custom Monogram & Logo Fees</span>
                  <span>+{formatINR(totalCustomizationFee)}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-{formatINR(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Standard Pan-India Shipping</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-400 font-bold uppercase">FREE</span>
                  ) : (
                    formatINR(shippingFee)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Estimated GST (5% Included)</span>
                <span>{formatINR(taxAmount)}</span>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-sm font-semibold text-slate-200">Total Amount</span>
              <span className="text-2xl font-bold font-serif text-amber-400">
                {formatINR(finalTotal)}
              </span>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-[11px] text-slate-400 text-center space-y-1">
              <p className="flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Encrypted 256-bit checkout via Razorpay</span>
              </p>
              <p>Delivery across India in 3-5 business days.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
