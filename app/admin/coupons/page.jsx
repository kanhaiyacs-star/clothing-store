import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminCouponsManager from '@/components/admin/AdminCouponsManager';

export const metadata = {
  title: 'Coupons & Discounts | ThreadCraft Admin',
};

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/login?redirect=/admin/coupons');
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <AdminLayout>
      <AdminCouponsManager initialCoupons={coupons} />
    </AdminLayout>
  );
}
