'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [cart, setCart] = useState({ items: [], subtotal: 0, totalCount: 0 });
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user and cart on initial mount
  const refreshUserData = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching auth user:', err);
      setUser(null);
    }
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart || { items: [], subtotal: 0, totalCount: 0 });
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  }, []);

  const refreshWishlist = useCallback(async () => {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.wishlist || []);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([refreshUserData(), refreshCart(), refreshWishlist()]);
      setLoading(false);
    }
    init();
  }, [refreshUserData, refreshCart, refreshWishlist]);

  const addToCart = async ({ variantId, customDesignId, quantity = 1 }) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, customDesignId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add to cart');
      await refreshCart();
      return { success: true, cart: data.cart };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateCartQuantity = async (itemId, quantity) => {
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update quantity');
      await refreshCart();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove item');
      await refreshCart();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const toggleWishlist = async (productId) => {
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle wishlist');
      await refreshWishlist();
      return { success: true, isWishlisted: data.isWishlisted };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    await refreshCart();
    window.location.href = '/';
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        cart,
        wishlist,
        loading,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        toggleWishlist,
        refreshCart,
        refreshUserData,
        refreshWishlist,
        logout,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
