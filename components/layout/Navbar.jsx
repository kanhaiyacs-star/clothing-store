'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { 
  ShoppingBag, 
  Heart, 
  User, 
  Search, 
  Menu, 
  X, 
  Sparkles, 
  Scissors, 
  ShieldCheck, 
  LogOut,
  PackageCheck
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { user, cart, wishlist, logout } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const cartCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const wishlistCount = wishlist?.length || 0;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-slate-100 text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center space-x-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>
          PREMIUM APPAREL & CUSTOM MONOGRAMS | FREE SHIPPING ACROSS INDIA OVER ₹999 | CODE: <span className="text-amber-400 font-bold">THREAD10</span>
        </span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shadow-md">
                <Scissors className="w-5 h-5" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-slate-900">
                Thread<span className="text-amber-600 font-sans font-light">Craft</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              href="/products?category=formal-shirts"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 tracking-wide hover:border-b-2 hover:border-amber-600 pb-1 transition-all"
            >
              Formal Shirts
            </Link>
            <Link
              href="/products?category=t-shirts"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 tracking-wide hover:border-b-2 hover:border-amber-600 pb-1 transition-all"
            >
              T-Shirts
            </Link>
            <Link
              href="/customize/the-royal-oxford-shirt"
              className="flex items-center space-x-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 hover:bg-amber-100 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Custom Studio</span>
            </Link>
            <Link
              href="/collections/oxford-executive"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 tracking-wide hover:border-b-2 hover:border-amber-600 pb-1 transition-all"
            >
              Oxford Executive
            </Link>
            <Link
              href="/collections/minimalist-urban"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 tracking-wide hover:border-b-2 hover:border-amber-600 pb-1 transition-all"
            >
              Streetwear & Tees
            </Link>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Search Toggle */}
            <div className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Search products"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Wishlist */}
            <Link
              href="/account#wishlist"
              className="relative p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag */}
            <Link
              href="/cart"
              className="relative p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors group"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-1.5 p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="User Account"
              >
                <User className="w-5 h-5" />
                {user && (
                  <span className="hidden md:inline text-xs font-medium text-slate-800 max-w-[90px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                )}
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-500">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {user.role}
                        </span>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <User className="w-4 h-4 mr-2 text-slate-400" />
                        My Profile & Addresses
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <PackageCheck className="w-4 h-4 mr-2 text-slate-400" />
                        Order History
                      </Link>
                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
                        >
                          <ShieldCheck className="w-4 h-4 mr-2 text-amber-600" />
                          Admin Dashboard
                        </Link>
                      )}
                      <div className="border-t border-slate-100 my-1"></div>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4 mr-2 text-rose-500" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        Create an Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Expanded Bar */}
        {searchOpen && (
          <form
            onSubmit={handleSearchSubmit}
            className="pb-4 pt-1 animate-in fade-in duration-200"
          >
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search formal shirts, supima tees, linen, sizes..."
                className="w-full pl-11 pr-24 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-inner"
                autoFocus
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="submit"
                className="absolute right-2 top-2 px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/products?category=formal-shirts"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-slate-900 hover:text-amber-600"
          >
            Formal Shirts
          </Link>
          <Link
            href="/products?category=t-shirts"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-slate-900 hover:text-amber-600"
          >
            T-Shirts
          </Link>
          <Link
            href="/customize/the-royal-oxford-shirt"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-2 py-2 text-base font-semibold text-amber-600"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Personalized Shirt Studio</span>
          </Link>
          <Link
            href="/collections/oxford-executive"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-slate-900 hover:text-amber-600"
          >
            Oxford Executive Collection
          </Link>
          <Link
            href="/collections/minimalist-urban"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-slate-900 hover:text-amber-600"
          >
            Streetwear & Oversized
          </Link>
        </div>
      )}
    </header>
  );
}
