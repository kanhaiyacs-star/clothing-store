'use client';

import React, { useState } from 'react';
import { formatINR } from '@/lib/pricing';
import { 
  Sparkles, 
  Check, 
  Truck, 
  Eye, 
  Clock, 
  ShieldCheck, 
  X,
  ExternalLink
} from 'lucide-react';

const STATUS_OPTIONS = [
  'ALL',
  'DESIGN_REVIEW',
  'PAID',
  'PROCESSING',
  'READY_FOR_SHIPMENT',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

export default function AdminOrdersManager({ initialOrders = [] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingModal, setTrackingModal] = useState(null);
  const [courierName, setCourierName] = useState('BlueDart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'ALL') return true;
    return o.status === activeFilter;
  });

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDispatchShipment = async (e) => {
    e.preventDefault();
    if (!trackingModal || !trackingNumber.trim()) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: trackingModal.id,
          status: 'SHIPPED',
          courierName,
          trackingNumber: trackingNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign shipment tracking');

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === trackingModal.id
            ? {
                ...ord,
                status: 'SHIPPED',
                courierName,
                trackingNumber: trackingNumber.trim(),
              }
            : ord
        )
      );

      setTrackingModal(null);
      setTrackingNumber('');
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Order Fulfillment & Design Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage production stages, review personalized monograms/logos, and dispatch shipments.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => setActiveFilter(status)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === status
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {filteredOrders.length === 0 ? (
          <p className="text-xs text-slate-400 py-16 text-center">
            No orders found under {activeFilter.replace(/_/g, ' ')}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Custom Pieces</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => {
                  const hasCustom = ord.items.some((i) => Boolean(i.customDesignId));

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{ord.user?.name || 'Guest Customer'}</p>
                        <p className="text-[10px] text-slate-400">{ord.user?.email || ord.guestEmail}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        {hasCustom ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-md">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>Bespoke Design</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Ready-to-wear</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-serif font-bold text-slate-900">
                        {formatINR(ord.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'DESIGN_REVIEW'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : ord.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-800'
                            : ord.status === 'PROCESSING'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {/* Inspect modal button */}
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
                        >
                          Inspect Design
                        </button>

                        {/* Quick state transitions */}
                        {ord.status === 'DESIGN_REVIEW' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, 'PROCESSING')}
                            disabled={updating}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs"
                          >
                            Approve Design
                          </button>
                        )}

                        {ord.status === 'PROCESSING' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, 'READY_FOR_SHIPMENT')}
                            disabled={updating}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                          >
                            Ready to Ship
                          </button>
                        )}

                        {ord.status === 'READY_FOR_SHIPMENT' && (
                          <button
                            onClick={() => setTrackingModal(ord)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
                          >
                            Dispatch AWB
                          </button>
                        )}

                        {ord.status === 'SHIPPED' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, 'DELIVERED')}
                            disabled={updating}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Order & Custom Design Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900">
                  Order Details: {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Customer: {selectedOrder.user?.name || selectedOrder.guestEmail}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Design Review Cards */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Purchased Pieces & Tailoring Specs
              </h4>

              {selectedOrder.items.map((item) => {
                let customSnap = null;
                if (item.customDesignSnapshot) {
                  try {
                    customSnap = JSON.parse(item.customDesignSnapshot);
                  } catch {
                    customSnap = null;
                  }
                }

                let textObj = null;
                if (customSnap?.textConfig) {
                  try {
                    textObj = typeof customSnap.textConfig === 'string' ? JSON.parse(customSnap.textConfig) : customSnap.textConfig;
                  } catch {
                    textObj = null;
                  }
                }

                return (
                  <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                    <div className="flex justify-between">
                      <p className="font-bold text-slate-900 text-sm">{item.productName}</p>
                      <span className="font-serif font-bold">{formatINR(item.totalPrice)}</span>
                    </div>

                    {customSnap ? (
                      <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
                        <span className="font-bold text-amber-900 flex items-center">
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          Customized Bespoke Specification
                        </span>
                        <p>Placement: <strong className="uppercase">{customSnap.placement}</strong></p>
                        {textObj?.text && (
                          <p>
                            Monogram Text: <strong className="font-serif text-sm">&quot;{textObj.text}&quot;</strong> (Thread Color: {textObj.color}, Font: {textObj.font})
                          </p>
                        )}
                        {customSnap.previewUrl && (
                          <div className="pt-2">
                            <p className="font-semibold text-slate-700 mb-1">Uploaded Insignia Artwork:</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={customSnap.previewUrl}
                              alt="Logo"
                              className="max-h-24 bg-white p-2 border border-slate-200 rounded-lg object-contain"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500">Standard Ready-to-Wear</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Status Change Buttons inside Modal */}
            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              {selectedOrder.status === 'DESIGN_REVIEW' && (
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedOrder.id, 'PROCESSING');
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
                >
                  Approve Design & Start Tailoring
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shipment AWB Modal */}
      {trackingModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleDispatchShipment}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-serif font-bold text-slate-900">
              Dispatch Order {trackingModal.orderNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Enter courier partner and consignment AWB tracking reference.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Courier Partner</label>
              <select
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white"
              >
                <option value="BlueDart Express">BlueDart Express</option>
                <option value="Delhivery Surface/Air">Delhivery</option>
                <option value="DTDC Express">DTDC Express</option>
                <option value="FedEx India">FedEx India</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tracking Number / AWB</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                required
                placeholder="e.g. BD789456123IN"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTrackingModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating || !trackingNumber.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Confirm Dispatch
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
