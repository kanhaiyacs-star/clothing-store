'use client';

import React, { useState } from 'react';
import { Search, Plus, Minus, AlertTriangle, Check } from 'lucide-react';

export default function AdminInventoryManager({ initialVariants = [] }) {
  const [variants, setVariants] = useState(initialVariants);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const filteredVariants = variants.filter((v) => {
    if (onlyLowStock && v.stock >= 10) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.sku.toLowerCase().includes(q) ||
        v.product.name.toLowerCase().includes(q) ||
        v.colorName.toLowerCase().includes(q) ||
        v.size.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAdjustStock = async (variantId, delta) => {
    setUpdatingId(variantId);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          stockDelta: delta,
          reason: 'ADMIN_MANUAL_ADJUSTMENT',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update stock');

      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, stock: data.variant.stock } : v))
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Inventory & Variant Stock Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock ledger, replenishment tracking, and low inventory safeguards.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
              onlyLowStock
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Low Stock Only (&lt;10)</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by SKU, Garment, Color, or Size..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      {/* Variants Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Variant SKU</th>
              <th className="py-3 px-4">Garment</th>
              <th className="py-3 px-4">Color</th>
              <th className="py-3 px-4">Fit</th>
              <th className="py-3 px-4">Size</th>
              <th className="py-3 px-4">Stock In Hand</th>
              <th className="py-3 px-4 text-right">Adjust Quantity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredVariants.map((v) => {
              const isLow = v.stock < 10;
              const isOut = v.stock === 0;

              return (
                <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {v.sku}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {v.product.name}
                  </td>
                  <td className="py-3.5 px-4 flex items-center space-x-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300"
                      style={{ backgroundColor: v.colorHex }}
                    />
                    <span className="text-slate-700">{v.colorName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{v.fit}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{v.size}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold font-mono ${
                        isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                      }`}>
                        {v.stock}
                      </span>
                      {isLow && (
                        <span className="px-1.5 py-0.2 bg-rose-50 text-rose-600 text-[10px] font-bold rounded">
                          Low
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center space-x-1.5">
                      <button
                        onClick={() => handleAdjustStock(v.id, -5)}
                        disabled={updatingId === v.id || v.stock < 5}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg disabled:opacity-40"
                        title="Reduce 5 units"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleAdjustStock(v.id, -1)}
                        disabled={updatingId === v.id || v.stock < 1}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg disabled:opacity-40"
                        title="Reduce 1 unit"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleAdjustStock(v.id, 1)}
                        disabled={updatingId === v.id}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg"
                        title="Add 1 unit"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleAdjustStock(v.id, 10)}
                        disabled={updatingId === v.id}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg"
                        title="Restock 10 units"
                      >
                        +10
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
