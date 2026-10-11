'use client';

import React, { useState } from 'react';
import { formatINR } from '@/lib/pricing';
import { Plus, Sparkles, Check, X } from 'lucide-react';

export default function AdminProductsManager({ initialProducts = [], categories = [] }) {
  const [products, setProducts] = useState(initialProducts);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    categoryId: categories[0]?.id || '',
    sku: '',
    basePrice: '',
    salePrice: '',
    fabric: '',
    description: '',
    isCustomizable: true,
    imageUrl: '',
  });

  const handleNameChange = (e) => {
    const val = e.target.value;
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: autoSlug,
    }));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Default variants for newly created product
      const defaultVariants = [
        { sku: `${formData.sku}-WHT-REG-M`, colorName: 'Crisp White', colorHex: '#FFFFFF', size: 'M', fit: 'Regular Fit', stock: 20 },
        { sku: `${formData.sku}-WHT-REG-L`, colorName: 'Crisp White', colorHex: '#FFFFFF', size: 'L', fit: 'Regular Fit', stock: 20 },
        { sku: `${formData.sku}-WHT-SLM-M`, colorName: 'Crisp White', colorHex: '#FFFFFF', size: 'M', fit: 'Slim Fit', stock: 20 },
      ];

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          variants: defaultVariants,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');

      setProducts([data.product, ...products]);
      setShowAddModal(false);
      setFormData({
        name: '',
        slug: '',
        categoryId: categories[0]?.id || '',
        sku: '',
        basePrice: '',
        salePrice: '',
        fabric: '',
        description: '',
        isCustomizable: true,
        imageUrl: '',
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Catalog & Garment Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your formal shirts, t-shirts, customizability flags, and pricing.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Garment</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Garment</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Base Price</th>
              <th className="py-3 px-4">Customizable</th>
              <th className="py-3 px-4">Variants</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => {
              const primaryImg =
                p.images?.[0]?.url ||
                'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=200&q=80';

              return (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 flex items-center space-x-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={primaryImg}
                      alt={p.name}
                      className="w-10 h-12 object-cover rounded-lg border border-slate-200"
                    />
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">/{p.slug}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{p.category?.name}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">{p.sku}</td>
                  <td className="py-3 px-4 font-serif font-bold text-slate-900">
                    {formatINR(p.basePrice)}
                    {p.salePrice && (
                      <span className="text-[10px] text-rose-600 block">
                        Sale: {formatINR(p.salePrice)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {p.isCustomizable ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-md">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Eligible</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Ready-made</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {p.variants?.length || 0} variants
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                      Published
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateProduct}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-serif font-bold text-slate-900">
                Add New Garment to Catalog
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Garment Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                required
                placeholder="The Royal Oxford Light Pink Shirt"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Product SKU *
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  required
                  placeholder="TC-SHIRT-005"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Base Price (INR ₹) *
                </label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  required
                  placeholder="2499"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Sale Price (Optional)
                </label>
                <input
                  type="number"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  placeholder="1999"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Fabric Details
              </label>
              <input
                type="text"
                value={formData.fabric}
                onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                placeholder="100% Egyptian Giza Cotton 100s"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Crafted with single-needle tailoring..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isCustomizable"
                checked={formData.isCustomizable}
                onChange={(e) => setFormData({ ...formData, isCustomizable: e.target.checked })}
                className="rounded accent-slate-900"
              />
              <label htmlFor="isCustomizable" className="text-xs font-semibold text-slate-800">
                Enable 2D Customization Studio for this garment
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                {saving ? 'Saving...' : 'Publish Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
