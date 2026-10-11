import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatINR } from '@/lib/pricing';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { 
  TrendingUp, 
  Package, 
  Users, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight 
} from 'lucide-react';

export const metadata = {
  title: 'Admin Dashboard Overview | ThreadCraft',
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  let admin = null;
  try {
    admin = await requireAdmin();
  } catch {
    redirect('/login?redirect=/admin');
  }

  // 1. Total paid revenue
  const paidOrders = await prisma.order.findMany({
    where: {
      status: { in: ['PAID', 'PROCESSING', 'DESIGN_REVIEW', 'READY_FOR_SHIPMENT', 'SHIPPED', 'DELIVERED'] },
    },
    select: { totalAmount: true },
  });
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // 2. Metrics
  const [totalOrders, totalCustomers, lowStockCount, pendingDesignReviews, recentOrders] =
    await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.productVariant.count({ where: { stock: { lt: 10 } } }),
      prisma.order.count({ where: { status: 'DESIGN_REVIEW' } }),
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          items: true,
        },
      }),
    ]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            Operations & Revenue Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time business telemetry for ThreadCraft India.
          </p>
        </div>

        {/* 4 Primary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Revenue */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-serif text-slate-900">
              {formatINR(totalRevenue)}
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold">
              Verified Razorpay Orders
            </p>
          </div>

          {/* Total Orders */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-serif text-slate-900">{totalOrders}</p>
            <p className="text-[10px] text-slate-500">All Order Lifecycles</p>
          </div>

          {/* Pending Custom Design Reviews */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Design Reviews</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-serif text-slate-900">{pendingDesignReviews}</p>
            <p className="text-[10px] text-amber-700 font-semibold">Requires Master Tailor Approval</p>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Low Stock SKUs</span>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-serif text-slate-900">{lowStockCount}</p>
            <p className="text-[10px] text-rose-600 font-semibold">&lt; 10 Units in Inventory</p>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Recent Store Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No orders recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5">Order Ref</th>
                    <th className="py-2.5">Customer</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Items</th>
                    <th className="py-2.5">Total Amount</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 text-slate-700">
                        {ord.user?.name || ord.guestEmail || 'Guest'}
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>
                      <td className="py-3 text-slate-600">{ord.items.length} items</td>
                      <td className="py-3 font-serif font-bold text-slate-900">
                        {formatINR(ord.totalAmount)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'DESIGN_REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : ord.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/admin/orders`}
                          className="text-xs font-semibold text-amber-600 hover:underline"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
