import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminProductsManager from '@/components/admin/AdminProductsManager';

export const metadata = {
  title: 'Product Catalog Management | ThreadCraft Admin',
};

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/login?redirect=/admin/products');
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        images: true,
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany(),
  ]);

  return (
    <AdminLayout>
      <AdminProductsManager initialProducts={products} categories={categories} />
    </AdminLayout>
  );
}
