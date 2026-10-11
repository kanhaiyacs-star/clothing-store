import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminInventoryManager from '@/components/admin/AdminInventoryManager';

export const metadata = {
  title: 'Inventory & Stock Management | ThreadCraft Admin',
};

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/login?redirect=/admin/inventory');
  }

  const variants = await prisma.productVariant.findMany({
    include: {
      product: true,
    },
    orderBy: [
      { product: { name: 'asc' } },
      { sku: 'asc' },
    ],
  });

  return (
    <AdminLayout>
      <AdminInventoryManager initialVariants={variants} />
    </AdminLayout>
  );
}
