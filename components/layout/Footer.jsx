'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Scissors, ShieldCheck, Truck, RefreshCw, Heart } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-900 mt-auto">
      {/* Trust Highlights */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Free Pan-India Delivery</h4>
              <p className="text-xs text-slate-400 mt-0.5">Complimentary shipping on orders above ₹999</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Bespoke Customization</h4>
              <p className="text-xs text-slate-400 mt-0.5">Custom monograms, graphics, and logos</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">100% Secure Checkout</h4>
              <p className="text-xs text-slate-400 mt-0.5">Encrypted UPI, Cards, & NetBanking via Razorpay</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Easy 7-Day Exchange</h4>
              <p className="text-xs text-slate-400 mt-0.5">Hassle-free size replacement support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Story */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                <Scissors className="w-4 h-4" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                Thread<span className="text-amber-400 font-sans font-light">Craft</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              ThreadCraft is an Indian luxury menswear label marrying classic tailoring with interactive personalization. From 100s 2-ply Egyptian cotton formal wear to 280 GSM heavyweight oversized streetwear tees.
            </p>
            <div className="pt-2 text-xs text-slate-400 flex items-center space-x-2">
              <span>Currency:</span>
              <span className="bg-slate-900 px-2 py-1 rounded text-white font-medium">INR (₹) — India</span>
            </div>
          </div>

          {/* Catalog */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Shop Collections</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/products?category=formal-shirts" className="hover:text-amber-400 transition-colors">
                  Egyptian Cotton Formal Shirts
                </Link>
              </li>
              <li>
                <Link href="/products?category=t-shirts" className="hover:text-amber-400 transition-colors">
                  Supima Crewneck T-Shirts
                </Link>
              </li>
              <li>
                <Link href="/customize/the-royal-oxford-shirt" className="hover:text-amber-400 transition-colors">
                  Custom Monogram Studio
                </Link>
              </li>
              <li>
                <Link href="/collections/oxford-executive" className="hover:text-amber-400 transition-colors">
                  Oxford Executive Range
                </Link>
              </li>
              <li>
                <Link href="/collections/minimalist-urban" className="hover:text-amber-400 transition-colors">
                  Minimalist Urban Drops
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Customer Care</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/orders" className="hover:text-amber-400 transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-amber-400 transition-colors">
                  My Profile & Addresses
                </Link>
              </li>
              <li>
                <span className="text-slate-400">Shipping: 3-5 Business Days</span>
              </li>
              <li>
                <span className="text-slate-400">Support: support@threadcraft.in</span>
              </li>
              <li>
                <span className="text-slate-400">WhatsApp: +91 98765 43210</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Craft Club</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Subscribe to receive preview access to limited edition drops, tailoring tips, and exclusive secret coupon codes.
            </p>
            {subscribed ? (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-300 text-xs font-medium">
                ✓ Thank you for subscribing! Check your inbox for 10% off.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
                >
                  Join ThreadCraft
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <p>© 2026 ThreadCraft Pvt. Ltd. All rights reserved. Handcrafted in India.</p>
        <div className="flex items-center space-x-6">
          <span>100% Genuine Cotton</span>
          <span>•</span>
          <span>Verified Razorpay Merchant</span>
          <span>•</span>
          <span className="flex items-center">
            Crafted with <Heart className="w-3 h-3 text-rose-500 mx-1 fill-rose-500" /> in India
          </span>
        </div>
      </div>
    </footer>
  );
}
