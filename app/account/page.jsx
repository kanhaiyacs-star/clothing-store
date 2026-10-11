import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { 
  User, 
  MapPin, 
  Sparkles, 
  Package, 
  Heart, 
  ShieldCheck, 
  Plus, 
  ExternalLink 
} from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';

export const metadata = {
  title: 'My Account | ThreadCraft',
};

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login?redirect=/account');
  }

  // Fetch user addresses, custom designs, wishlist, and orders count
  const [addresses, designs, wishlistItems, ordersCount] = await Promise.all([
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: 'desc' },
    }),
    prisma.customDesign.findMany({
      where: { userId: user.id },
      include: {
        product: true,
        logoAsset: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            images: true,
            variants: true,
          },
        },
      },
    }),
    prisma.order.count({
      where: { userId: user.id },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Profile Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-serif text-2xl font-bold shadow-md">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-serif font-bold text-white">{user.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-amber-400 border border-slate-700">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            {user.phone && <p className="text-xs text-slate-400">{user.phone}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-2"
          >
            <Package className="w-4 h-4 text-amber-400" />
            <span>My Orders ({ordersCount})</span>
          </Link>

          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 shadow-md"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>Admin Dashboard</span>
            </Link>
          )}
        </div>
      </div>

      {/* Grid: Saved Addresses (1/2) & Custom Designs Gallery (1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Saved Addresses */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>Saved Delivery Addresses</span>
            </h2>
          </div>

          {addresses.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No saved addresses yet. Addresses used at checkout will be saved here automatically.
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 relative"
                >
                  {addr.isDefault && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                  <p className="font-bold text-slate-900">{addr.fullName}</p>
                  <p className="text-slate-600">{addr.addressLine1}</p>
                  {addr.addressLine2 && <p className="text-slate-600">{addr.addressLine2}</p>}
                  <p className="text-slate-600">
                    {addr.city}, {addr.state} - {addr.postalCode}
                  </p>
                  <p className="text-slate-500">Phone: {addr.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Custom Designs */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>My Custom Shirt Creations ({designs.length})</span>
            </h2>
          </div>

          {designs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 space-y-2">
              <p>You haven&apos;t saved any custom designs yet.</p>
              <Link
                href="/customize/the-royal-oxford-shirt"
                className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Create a Custom Shirt
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {designs.map((dsg) => {
                let textInfo = null;
                if (dsg.textConfig) {
                  try {
                    textInfo = typeof dsg.textConfig === 'string' ? JSON.parse(dsg.textConfig) : dsg.textConfig;
                  } catch {
                    textInfo = null;
                  }
                }

                return (
                  <div
                    key={dsg.id}
                    className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-xs space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900">{dsg.designName}</h4>
                        <p className="text-[11px] text-slate-500">
                          Garment: {dsg.product?.name} • Placement: {dsg.placement.replace('_', ' ')}
                        </p>
                      </div>
                      <Link
                        href={`/customize/${dsg.product?.slug || dsg.productId}`}
                        className="text-amber-700 font-bold hover:underline flex items-center space-x-1"
                      >
                        <span>Edit Studio</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    {textInfo?.text && (
                      <p className="text-[11px] text-slate-700">
                        Custom Text: <strong className="font-serif">&quot;{textInfo.text}&quot;</strong>
                      </p>
                    )}

                    {dsg.logoAsset && (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        Uploaded Logo Insignia: {dsg.logoAsset.originalName}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Wishlist Section */}
      <div id="wishlist" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-serif font-bold text-slate-900 flex items-center space-x-2">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
          <span>My Wishlist ({wishlistItems.length})</span>
        </h2>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">
            Your wishlist is empty. Tap the heart icon on any shirt to bookmark it here.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <ProductCard key={item.id} product={item.product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
