import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { formatINR } from '@/lib/pricing';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  Clock, 
  Sparkles, 
  ArrowLeft,
  ShieldCheck,
  FileText
} from 'lucide-react';

export async function generateMetadata({ params }) {
  const { orderId } = await params;
  return {
    title: `Order Details | ThreadCraft`,
  };
}

export default async function OrderDetailPage({ params }) {
  const { orderId } = await params;

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }],
    },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
          customDesign: true,
        },
      },
      payments: true,
      shipments: true,
    },
  });

  if (!order) {
    notFound();
  }

  let address = null;
  try {
    address = JSON.parse(order.shippingAddress);
  } catch {
    address = {};
  }

  const isPaid = ['PAID', 'DESIGN_REVIEW', 'PROCESSING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'DELIVERED'].includes(
    order.status
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/orders"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>
      </div>

      {/* Confirmation Banner */}
      <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Order Successfully Placed</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Thank you for shopping with ThreadCraft!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Order Reference: <strong className="text-amber-400 font-mono">{order.orderNumber}</strong>
          </p>
        </div>
      </div>

      {/* Status Card & Order Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <span className="text-xs text-slate-400 font-medium">Order Status</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                order.status === 'DELIVERED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : order.status === 'DESIGN_REVIEW'
                  ? 'bg-amber-100 text-amber-800'
                  : order.status === 'SHIPPED'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-800'
              }`}>
                {order.status.replace(/_/g, ' ')}
              </span>
              {order.status === 'DESIGN_REVIEW' && (
                <span className="text-xs text-amber-700 font-medium">
                  (Custom Monogram/Logo in Tailor Review)
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Placed on: {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>

        {/* Courier Tracking if Shipped */}
        {order.trackingNumber && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
            <div className="flex items-center text-blue-900 font-bold">
              <Truck className="w-4 h-4 mr-1.5" />
              <span>Shipment Dispatched via {order.courierName || 'BlueDart / Delhivery'}</span>
            </div>
            <p className="text-blue-800">
              Tracking AWB: <span className="font-mono font-bold">{order.trackingNumber}</span>
            </p>
          </div>
        )}

        {/* Items Purchased */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Ordered Garments ({order.items.length})
          </h3>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => {
              let variantMeta = {};
              try {
                variantMeta = JSON.parse(item.variantDetails);
              } catch {
                variantMeta = {};
              }

              let customMeta = null;
              if (item.customDesignSnapshot) {
                try {
                  customMeta = JSON.parse(item.customDesignSnapshot);
                } catch {
                  customMeta = null;
                }
              }

              return (
                <div key={item.id} className="py-4 flex justify-between items-start text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">
                      {item.productName}
                    </p>
                    <p className="text-slate-500">
                      Fit: {variantMeta.fit || 'Regular'} • Size: {variantMeta.size || 'M'} • Color: {variantMeta.colorName || 'White'}
                    </p>
                    <p className="text-slate-400 font-mono text-[11px]">
                      SKU: {variantMeta.sku || 'TC-GARMENT'}
                    </p>

                    {/* Snapshot of Custom Design */}
                    {customMeta && (
                      <div className="mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200 space-y-1">
                        <span className="font-semibold text-amber-800 flex items-center">
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          Customized Bespoke Piece
                        </span>
                        <p className="text-[11px] text-slate-600">
                          Placement: <span className="uppercase font-semibold">{customMeta.placement?.replace('_', ' ')}</span>
                        </p>
                        {customMeta.textConfig && (
                          <p className="text-[11px] text-slate-600">
                            Custom Text: <span className="font-serif font-bold text-slate-900">&quot;{typeof customMeta.textConfig === 'string' ? JSON.parse(customMeta.textConfig).text : customMeta.textConfig.text}&quot;</span>
                          </p>
                        )}
                        {customMeta.previewUrl && (
                          <p className="text-[11px] text-emerald-700 font-semibold">
                            Custom Logo insignia submitted
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-bold font-serif text-sm text-slate-900">
                      {formatINR(item.totalPrice)}
                    </p>
                    <p className="text-slate-400 text-[11px]">Qty: {item.quantity}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Discount ({order.couponCode || 'Promo'})</span>
              <span>-{formatINR(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{order.shippingFee === 0 ? 'FREE' : formatINR(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxes (5% GST)</span>
            <span>{formatINR(order.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 font-serif pt-2 border-t border-slate-100">
            <span>Total Paid</span>
            <span className="text-amber-600">{formatINR(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Delivery Address Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2 text-xs">
        <h3 className="font-bold uppercase tracking-wider text-slate-900">
          Delivery Address
        </h3>
        <p className="font-semibold text-slate-800">{address.fullName}</p>
        <p className="text-slate-600">{address.addressLine1}</p>
        {address.addressLine2 && <p className="text-slate-600">{address.addressLine2}</p>}
        <p className="text-slate-600">
          {address.city}, {address.state} - {address.postalCode}
        </p>
        <p className="text-slate-600">Phone: {address.phone}</p>
      </div>
    </div>
  );
}
