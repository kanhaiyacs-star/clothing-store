const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding ThreadCraft Database ---');

  // 1. Seed Admin & Demo Customer
  const adminPasswordHash = await bcrypt.hash('AdminPassword@123', 10);
  const customerPasswordHash = await bcrypt.hash('Customer@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@threadcraft.in' },
    update: {},
    create: {
      name: 'ThreadCraft Administrator',
      email: 'admin@threadcraft.in',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      phone: '+91 98765 43210',
    },
  });

  const demoCustomer = await prisma.user.upsert({
    where: { email: 'customer@threadcraft.in' },
    update: {},
    create: {
      name: 'Aditya Sharma',
      email: 'customer@threadcraft.in',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      phone: '+91 98123 45678',
    },
  });

  console.log(`Created users: Admin (${admin.email}), Customer (${demoCustomer.email})`);

  // Default address for customer
  await prisma.address.deleteMany({ where: { userId: demoCustomer.id } });
  await prisma.address.create({
    data: {
      userId: demoCustomer.id,
      fullName: 'Aditya Sharma',
      addressLine1: '42, Prestige Palms, Indiranagar',
      addressLine2: '100ft Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      country: 'India',
      phone: '+91 98123 45678',
      isDefault: true,
    },
  });

  // 2. Categories
  const formalCategory = await prisma.category.upsert({
    where: { slug: 'formal-shirts' },
    update: {},
    create: {
      name: 'Formal Shirts',
      slug: 'formal-shirts',
      description: 'Handcrafted Egyptian cotton and twill formal shirts tailored for boardroom elegance and refined occasions.',
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=80',
    },
  });

  const tshirtCategory = await prisma.category.upsert({
    where: { slug: 't-shirts' },
    update: {},
    create: {
      name: 'T-Shirts',
      slug: 't-shirts',
      description: 'Ultra-soft Supima cotton and heavyweight boxy T-shirts designed for everyday luxury and custom graphic printing.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
    },
  });

  // 3. Collections
  const oxfordCollection = await prisma.collection.upsert({
    where: { slug: 'oxford-executive' },
    update: {},
    create: {
      name: 'Oxford Executive',
      slug: 'oxford-executive',
      description: 'Classic luxury weave and structured silhouettes.',
      image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1200&q=80',
    },
  });

  const urbanCollection = await prisma.collection.upsert({
    where: { slug: 'minimalist-urban' },
    update: {},
    create: {
      name: 'Minimalist Urban',
      slug: 'minimalist-urban',
      description: 'Modern relaxed fits and premium neutral tones.',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
    },
  });

  // 4. Products & Variants
  // Product 1: The Royal Oxford White Shirt
  const prod1 = await prisma.product.upsert({
    where: { slug: 'the-royal-oxford-shirt' },
    update: {},
    create: {
      name: 'The Royal Oxford White Shirt',
      slug: 'the-royal-oxford-shirt',
      description: 'Woven with authentic 100% Egyptian Giza long-staple cotton in a 2-ply 100s yarn. Features a semi-spread collar, mother-of-pearl buttons, and single-needle tailoring. Customizable with personal monograms or chest embroidery.',
      categoryId: formalCategory.id,
      collectionId: oxfordCollection.id,
      sku: 'TC-OXF-001',
      basePrice: 2499,
      salePrice: 1999,
      fabric: '100% Egyptian Giza Cotton (100s 2-ply)',
      careInstructions: 'Machine wash cold with like colors. Warm iron while damp. Do not bleach.',
      isCustomizable: true,
      isPublished: true,
    },
  });

  // Images for Prod 1
  await prisma.productImage.deleteMany({ where: { productId: prod1.id } });
  await prisma.productImage.createMany({
    data: [
      {
        productId: prod1.id,
        url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80',
        altText: 'The Royal Oxford White Shirt front view',
        isPrimary: true,
        displayOrder: 1,
      },
      {
        productId: prod1.id,
        url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=80',
        altText: 'The Royal Oxford White Shirt collar detail',
        isPrimary: false,
        displayOrder: 2,
      },
    ],
  });

  // Variants for Prod 1
  await prisma.productVariant.deleteMany({ where: { productId: prod1.id } });
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const fits = ['Regular Fit', 'Slim Fit'];
  const colorsProd1 = [
    { name: 'Crisp White', hex: '#FFFFFF', code: 'WHT' },
    { name: 'Sky Blue', hex: '#BAE6FD', code: 'BLU' },
  ];

  for (const color of colorsProd1) {
    for (const fit of fits) {
      for (const size of sizes) {
        await prisma.productVariant.create({
          data: {
            productId: prod1.id,
            sku: `TC-OXF-${color.code}-${fit === 'Regular Fit' ? 'REG' : 'SLM'}-${size}`,
            colorName: color.name,
            colorHex: color.hex,
            size: size,
            fit: fit,
            stock: 25,
            priceAdjustment: 0,
          },
        });
      }
    }
  }

  // Product 2: The Sovereign French Linen Shirt
  const prod2 = await prisma.product.upsert({
    where: { slug: 'the-sovereign-linen-shirt' },
    update: {},
    create: {
      name: 'The Sovereign French Linen Shirt',
      slug: 'the-sovereign-linen-shirt',
      description: 'Crafted from breezy, pre-washed French flax linen. Ideal for smart-casual summer soirees and tropical boardroom settings. Breathable, durable, and softens with every wash.',
      categoryId: formalCategory.id,
      collectionId: oxfordCollection.id,
      sku: 'TC-LIN-002',
      basePrice: 2799,
      salePrice: null,
      fabric: '100% Pre-washed French Flax Linen',
      careInstructions: 'Gentle cycle, hang dry in shade. Light steam iron for relaxed texture.',
      isCustomizable: true,
      isPublished: true,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: prod2.id } });
  await prisma.productImage.createMany({
    data: [
      {
        productId: prod2.id,
        url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80',
        altText: 'The Sovereign French Linen Shirt in Navy',
        isPrimary: true,
        displayOrder: 1,
      },
    ],
  });

  await prisma.productVariant.deleteMany({ where: { productId: prod2.id } });
  const colorsProd2 = [
    { name: 'Navy Blue', hex: '#1E3A8A', code: 'NVY' },
    { name: 'Sage Olive', hex: '#4B5563', code: 'OLV' },
  ];
  for (const color of colorsProd2) {
    for (const fit of ['Regular Fit', 'Slim Fit']) {
      for (const size of ['M', 'L', 'XL']) {
        await prisma.productVariant.create({
          data: {
            productId: prod2.id,
            sku: `TC-LIN-${color.code}-${fit === 'Regular Fit' ? 'REG' : 'SLM'}-${size}`,
            colorName: color.name,
            colorHex: color.hex,
            size: size,
            fit: fit,
            stock: 18,
            priceAdjustment: 0,
          },
        });
      }
    }
  }

  // Product 3: The Signature Supima Crewneck T-Shirt
  const prod3 = await prisma.product.upsert({
    where: { slug: 'the-signature-supima-tshirt' },
    update: {},
    create: {
      name: 'The Signature Supima Crewneck T-Shirt',
      slug: 'the-signature-supima-tshirt',
      description: 'Ultra-luxurious 220 GSM combed Californian Supima cotton. Unmatched softness, rich color retention, and anti-pilling finish. Perfectly optimized as a canvas for custom chest logos, names, and back graphics.',
      categoryId: tshirtCategory.id,
      collectionId: urbanCollection.id,
      sku: 'TC-TSH-003',
      basePrice: 1299,
      salePrice: 999,
      fabric: '100% Californian Supima Cotton (220 GSM)',
      careInstructions: 'Machine wash cold inside out. Tumble dry low or dry flat.',
      isCustomizable: true,
      isPublished: true,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: prod3.id } });
  await prisma.productImage.createMany({
    data: [
      {
        productId: prod3.id,
        url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
        altText: 'The Signature Supima Crewneck T-Shirt in White',
        isPrimary: true,
        displayOrder: 1,
      },
      {
        productId: prod3.id,
        url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80',
        altText: 'The Signature Supima Crewneck T-Shirt in Black',
        isPrimary: false,
        displayOrder: 2,
      },
    ],
  });

  await prisma.productVariant.deleteMany({ where: { productId: prod3.id } });
  const colorsProd3 = [
    { name: 'Pure White', hex: '#FFFFFF', code: 'WHT' },
    { name: 'Pitch Black', hex: '#111827', code: 'BLK' },
    { name: 'Heather Grey', hex: '#9CA3AF', code: 'GRY' },
    { name: 'Sage Green', hex: '#374151', code: 'SGE' },
  ];
  for (const color of colorsProd3) {
    for (const fit of ['Regular Fit', 'Oversized Fit']) {
      for (const size of sizes) {
        await prisma.productVariant.create({
          data: {
            productId: prod3.id,
            sku: `TC-SUP-${color.code}-${fit === 'Regular Fit' ? 'REG' : 'OVR'}-${size}`,
            colorName: color.name,
            colorHex: color.hex,
            size: size,
            fit: fit,
            stock: 35,
            priceAdjustment: 0,
          },
        });
      }
    }
  }

  // Product 4: The Heavyweight Boxy Streetwear Tee
  const prod4 = await prisma.product.upsert({
    where: { slug: 'the-heavyweight-boxy-tee' },
    update: {},
    create: {
      name: 'The Heavyweight Boxy Streetwear Tee',
      slug: 'the-heavyweight-boxy-tee',
      description: 'Constructed from dense 280 GSM premium cotton with dropped shoulders, a tight ribbed collar, and relaxed boxy drape. Engineered for vibrant DTG and custom screen prints on front and back.',
      categoryId: tshirtCategory.id,
      collectionId: urbanCollection.id,
      sku: 'TC-HVY-004',
      basePrice: 1499,
      salePrice: 1199,
      fabric: '280 GSM Heavyweight Dense Combed Cotton',
      careInstructions: 'Machine wash cold. Do not iron directly over prints.',
      isCustomizable: true,
      isPublished: true,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: prod4.id } });
  await prisma.productImage.createMany({
    data: [
      {
        productId: prod4.id,
        url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
        altText: 'The Heavyweight Boxy Streetwear Tee front',
        isPrimary: true,
        displayOrder: 1,
      },
    ],
  });

  await prisma.productVariant.deleteMany({ where: { productId: prod4.id } });
  const colorsProd4 = [
    { name: 'Vintage Charcoal', hex: '#1F2937', code: 'CHR' },
    { name: 'Desert Sand', hex: '#D1D5DB', code: 'SND' },
  ];
  for (const color of colorsProd4) {
    for (const size of ['M', 'L', 'XL', 'XXL']) {
      await prisma.productVariant.create({
        data: {
          productId: prod4.id,
          sku: `TC-HVY-${color.code}-OVR-${size}`,
          colorName: color.name,
          colorHex: color.hex,
          size: size,
          fit: 'Oversized Fit',
          stock: 30,
          priceAdjustment: 0,
        },
      });
    }
  }

  // 5. Coupons
  await prisma.coupon.upsert({
    where: { code: 'THREAD10' },
    update: {},
    create: {
      code: 'THREAD10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 999,
      maxDiscount: 500,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'WELCOME200' },
    update: {},
    create: {
      code: 'WELCOME200',
      discountType: 'FIXED',
      discountValue: 200,
      minOrderValue: 1499,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'CRAFT15' },
    update: {},
    create: {
      code: 'CRAFT15',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderValue: 1999,
      maxDiscount: 750,
      isActive: true,
    },
  });

  console.log('--- ThreadCraft database seeded successfully! ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
