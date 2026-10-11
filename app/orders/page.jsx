import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatINR } from '@/lib/pricing';
import { Package, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'My Orders | ThreadCraft',
};

export const dynamic = 'force-dynamic';

export default async function OrdersHistoryPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
          Sign In to View Orders
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Please sign in to your ThreadCraft account to view your past purchases and track deliveries.
        </p>
        <Link
          href="/login?redirect=/orders"
          className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Sign In to Your Account
        </Link>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
        My Orders
      </h1>
      <p className="text-xs text-slate-500 mb-8">
        Review your order history, tracking statuses, and design snapshots.
      </p>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
          <Package className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No past orders yet</p>
          <p className="text-xs text-slate-500 mt-1">When you place an order, it will appear here.</p>
          <Link
            href="/products"
            className="inline-block mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {ord.orderNumber}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    ord.status === 'DELIVERED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : ord.status === 'DESIGN_REVIEW'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {ord.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })} • {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                </p>

                <p className="text-xs font-bold text-slate-900 font-serif">
                  {formatINR(ord.totalAmount)}
                </p>
              </div>

              <Link
                href={`/orders/${ord.id}`}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold self-start sm:self-auto transition-colors"
              >
                <span>View Details & Receipt</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
