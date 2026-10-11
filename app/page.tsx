import Link from 'next/link';
import prisma from '@/lib/prisma';
import ProductCard from '@/components/products/ProductCard';
import { 
  Sparkles, 
  ArrowRight, 
  Scissors, 
  ShieldCheck, 
  Truck, 
  Star, 
  CheckCircle2 
} from 'lucide-react';

export default async function HomePage() {
  // Query featured products and categories from MySQL
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    include: {
      category: true,
      images: { orderBy: { displayOrder: 'asc' } },
      variants: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const formalShirts = products.filter((p: any) => p.category?.slug === 'formal-shirts');
  const tshirts = products.filter((p: any) => p.category?.slug === 't-shirts');
  const customizableShirts = products.filter((p: any) => p.isCustomizable);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold tracking-wide backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ThreadCraft Studio 2026 Collection</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight text-white leading-[1.15]">
                Tailored Luxury.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
                  Personally Yours.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl font-light leading-relaxed">
                Handcrafted from 100s 2-ply Egyptian Giza cotton and 280 GSM heavyweight Supima cotton. Elevate your wardrobe with personalized monograms, quotes, and custom insignias.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/customize/the-royal-oxford-shirt"
                  className="px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-amber-500/25 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Customize Your Shirt</span>
                </Link>

                <Link
                  href="/products?category=formal-shirts"
                  className="px-7 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl border border-slate-700 transition-all hover:border-slate-600"
                >
                  Shop Formal Shirts
                </Link>

                <Link
                  href="/products?category=t-shirts"
                  className="px-7 py-3.5 text-slate-300 hover:text-white font-semibold text-sm transition-all"
                >
                  Explore T-Shirts →
                </Link>
              </div>

              {/* Quality Highlights */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800/80 text-xs text-slate-300">
                <div>
                  <p className="text-lg font-bold text-white font-serif">100%</p>
                  <p className="text-slate-400 mt-0.5">Egyptian Cotton</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white font-serif">2D Studio</p>
                  <p className="text-slate-400 mt-0.5">Real-time Preview</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white font-serif">Pan-India</p>
                  <p className="text-slate-400 mt-0.5">Free Delivery &gt; ₹999</p>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md aspect-[4/5] rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80"
                  alt="ThreadCraft Masterpiece Shirt"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-6">
                  <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
                    Custom Monogram Spotlight
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white mt-1">
                    The Royal Oxford Shirt
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Featuring customizable left-chest monogram in Imperial Gold thread.
                  </p>
                  <Link
                    href="/customize/the-royal-oxford-shirt"
                    className="mt-3 inline-flex items-center text-xs font-semibold text-amber-400 hover:text-amber-300"
                  >
                    Personalize This Shirt <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Customizer Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="text-amber-200 text-xs font-bold uppercase tracking-widest">
              Interactive 2D Customization Studio
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold leading-tight">
              Craft Your Signature Shirt with Monograms & Insignias
            </h2>
            <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed font-light">
              Don’t settle for off-the-rack. Use our interactive visual canvas to select your fit, add custom text or monograms, upload company or personal logos, and preview on both front and back.
            </p>
            <div className="pt-2">
              <Link
                href="/customize/the-royal-oxford-shirt"
                className="inline-flex items-center px-6 py-3 bg-white text-slate-950 font-bold text-sm rounded-xl hover:bg-amber-100 transition-colors shadow-md space-x-2"
              >
                <Scissors className="w-4 h-4 text-amber-600" />
                <span>Launch Custom Studio</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Formal Shirts Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Boardroom & Black Tie
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              Handcrafted Formal Shirts
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tailored from Giza long-staple cotton and pre-washed French flax linen.
            </p>
          </div>
          <Link
            href="/products?category=formal-shirts"
            className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-amber-600 flex items-center space-x-1"
          >
            <span>View All Formal Shirts</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {formalShirts.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. T-Shirts & Streetwear Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Modern Streetwear & Luxury Basics
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              Supima & Heavyweight T-Shirts
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              220 GSM to 280 GSM premium cotton tees, built to last and ready for custom graphics.
            </p>
          </div>
          <Link
            href="/products?category=t-shirts"
            className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-amber-600 flex items-center space-x-1"
          >
            <span>View All T-Shirts</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tshirts.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. The ThreadCraft Standard */}
      <section className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Uncompromising Quality
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              The ThreadCraft Difference
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Every detail is engineered for permanence, comfort, and distinction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">100s 2-Ply Long-Staple Cotton</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We spin only the finest long-staple fibers, producing cloth that is exceptionally smooth, breathable, and naturally resistant to creasing.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Bespoke Japanese Embroidery</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your custom monograms are rendered with high-density German Madeira threads that maintain luster through countless washes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Flawless Fit Guarantee</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Choose between regular, slim, and oversized silhouettes. Complimentary size replacement within 7 days if you need a different fit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Customer Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
            Real Reviews
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
            Loved by Modern Gentlemen Across India
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex text-amber-400 space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-600 italic leading-relaxed">
              &quot;The Royal Oxford with my monogram on the chest is easily the most complimented shirt in my wardrobe. The fabric weight and collar stiffness are exceptional.&quot;
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Dr. Rohan Kulkarni</p>
                <p className="text-[10px] text-slate-400">Mumbai • Verified Buyer</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex text-amber-400 space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-600 italic leading-relaxed">
              &quot;The Supima crewneck feels like silk yet has the structure of a heavyweight tee. Uploaded our startup logo and the print crispness is phenomenal.&quot;
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Vikramaditya Sen</p>
                <p className="text-[10px] text-slate-400">Bengaluru • Verified Buyer</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex text-amber-400 space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-600 italic leading-relaxed">
              &quot;Seamless Razorpay payment and delivered to Delhi in 3 days. The custom studio was so easy to use on my phone. ThreadCraft is now my go-to.&quot;
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Tanmay Gupta</p>
                <p className="text-[10px] text-slate-400">New Delhi • Verified Buyer</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
