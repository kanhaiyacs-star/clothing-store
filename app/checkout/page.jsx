'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { formatINR, PRICING_RULES } from '@/lib/pricing';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Lock
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, cart, refreshCart } = useStore();

  const items = cart?.items || [];

  // Shipping Address Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Karnataka',
    postalCode: '',
  });

  const [couponCode, setCouponCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sandboxModal, setSandboxModal] = useState(null);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
    const savedCoupon = sessionStorage.getItem('threadcraft_coupon');
    if (savedCoupon) {
      setCouponCode(savedCoupon);
    }
  }, [user]);

  // Pricing
  let subtotal = 0;
  for (const item of items) {
    const itemPrice = item.unitPrice;
    const customFee = item.customizationFee || 0;
    subtotal += (itemPrice + customFee) * item.quantity;
  }

  // Calculate discount if coupon saved
  let discountAmount = 0;
  if (couponCode === 'THREAD10') {
    discountAmount = Math.min(500, Math.round(subtotal * 0.1));
  } else if (couponCode === 'WELCOME200' && subtotal >= 1499) {
    discountAmount = 200;
  } else if (couponCode === 'CRAFT15' && subtotal >= 1999) {
    discountAmount = Math.min(750, Math.round(subtotal * 0.15));
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingFee =
    discountedSubtotal >= PRICING_RULES.FREE_SHIPPING_THRESHOLD || items.length === 0
      ? 0
      : PRICING_RULES.STANDARD_SHIPPING_FEE;
  const finalTotal = discountedSubtotal + shippingFee;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    // Validate 6-digit PIN code and phone
    if (!/^[1-9][0-9]{5}$/.test(formData.postalCode)) {
      setErrorMsg('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    if (formData.phone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      // 1. Create order on server
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: formData,
          couponCode: couponCode || null,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Failed to initialize order');

      const { order, razorpayOrder } = orderData;

      // 2. Razorpay Payment Trigger
      // Check if live/test Razorpay SDK should open or sandbox simulation
      if (razorpayOrder.isLive && window.Razorpay) {
        const options = {
          key: razorpayOrder.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          currency: 'INR',
          name: 'ThreadCraft',
          description: `Order ${order.orderNumber}`,
          order_id: razorpayOrder.orderId,
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone,
          },
          theme: { color: '#0F172A' },
          handler: async function (response) {
            await verifyAndCompleteOrder({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Development Sandbox Dialog
        setSandboxModal({
          order,
          razorpayOrder,
        });
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyAndCompleteOrder = async ({
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }) => {
    try {
      const verifyRes = await fetch('/api/checkout/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');

      sessionStorage.removeItem('threadcraft_coupon');
      await refreshCart();
      router.push(`/orders/${orderId}`);
    } catch (err) {
      alert(`Payment Verification Error: ${err.message}`);
    }
  };

  const handleSandboxSimulateSuccess = async () => {
    if (!sandboxModal) return;
    const { order, razorpayOrder } = sandboxModal;
    const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const mockSignature = `mock_sig_${Date.now()}_verified`;

    await verifyAndCompleteOrder({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.orderId,
      razorpayPaymentId: mockPaymentId,
      razorpaySignature: mockSignature,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8 pb-4 border-b border-slate-200">
        Checkout & Payment
      </h1>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Shipping Address Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>1. Delivery Destination</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Aditya Sharma"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Mobile Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Address (for Order Updates & Tracking) *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="aditya@example.com"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Flat, House No., Building, Street *
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  required
                  placeholder="42, Prestige Palms, 100ft Road"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Locality, Landmark (Optional)
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  placeholder="Near Indiranagar Metro Station"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  placeholder="Bengaluru"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  State *
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {[
                    'Karnataka',
                    'Maharashtra',
                    'Delhi',
                    'Tamil Nadu',
                    'Telangana',
                    'Gujarat',
                    'Uttar Pradesh',
                    'West Bengal',
                    'Rajasthan',
                    'Kerala',
                    'Haryana',
                    'Punjab',
                  ].map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  6-Digit PIN Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  required
                  placeholder="560038"
                  maxLength={6}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Badge */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>2. Payment Gateway</span>
            </h2>
            <div className="p-4 border-2 border-slate-900 rounded-xl bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Razorpay Secure Online Checkout
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  UPI (GPay, PhonePe, Paytm), All Major Debit/Credit Cards, NetBanking
                </p>
              </div>
              <Lock className="w-5 h-5 text-slate-700" />
            </div>
          </div>
        </div>

        {/* Right Column: Order Review & Submit (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Review Bag Items ({items.length})
            </h3>

            {/* Compact Item List */}
            <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 border-b border-slate-800 pb-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-slate-300">
                  <div className="truncate pr-2">
                    <p className="font-semibold text-white truncate">
                      {item.variant?.product?.name} × {item.quantity}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {item.variant?.fit} • {item.variant?.size} • {item.variant?.colorName}
                    </p>
                    {item.customDesign && (
                      <p className="text-[10px] text-amber-300 font-semibold">
                        ★ Custom Monogram / Logo
                      </p>
                    )}
                  </div>
                  <span className="font-serif">
                    {formatINR((item.unitPrice + (item.customizationFee || 0)) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="space-y-2 text-xs text-slate-300 border-b border-slate-800 pb-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Discount ({couponCode})</span>
                  <span>-{formatINR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Pan-India Delivery</span>
                <span>{shippingFee === 0 ? 'FREE' : formatINR(shippingFee)}</span>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-sm font-semibold text-slate-200">Amount Payable</span>
              <span className="text-2xl font-bold font-serif text-amber-400">
                {formatINR(finalTotal)}
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{submitting ? 'Initializing Gateway...' : `Pay ${formatINR(finalTotal)} via Razorpay`}</span>
            </button>

            <p className="text-[10px] text-slate-400 text-center">
              By proceeding, you agree to ThreadCraft&apos;s Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </form>

      {/* Development Mode Razorpay Sandbox Modal */}
      {sandboxModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center space-x-2 text-amber-600">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">
                Razorpay Test Sandbox
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Order <strong className="text-slate-900">{sandboxModal.order.orderNumber}</strong> was generated on the server with authoritative total <strong>{formatINR(sandboxModal.order.totalAmount)}</strong>.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
              <p>Razorpay Order: {sandboxModal.razorpayOrder.orderId}</p>
              <p>Currency: INR (₹)</p>
              <p>Status: Authenticated Sandbox</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleSandboxSimulateSuccess}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow"
              >
                Simulate Successful Razorpay Payment
              </button>

              <button
                onClick={() => setSandboxModal(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel / Test Retry Flow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
