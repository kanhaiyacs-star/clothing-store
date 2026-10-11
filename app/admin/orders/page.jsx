import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminOrdersManager from '@/components/admin/AdminOrdersManager';

export const metadata = {
  title: 'Order Management & Design Review | ThreadCraft Admin',
};

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/login?redirect=/admin/orders');
  }

  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: {
        include: {
          variant: { include: { product: true } },
          customDesign: true,
        },
      },
      payments: true,
      shipments: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <AdminLayout>
      <AdminOrdersManager initialOrders={orders} />
    </AdminLayout>
  );
}
