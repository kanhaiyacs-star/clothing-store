// Authoritative Server-Side Pricing Rules for ThreadCraft

export const PRICING_RULES = {
  FREE_SHIPPING_THRESHOLD: 999, // Orders >= ₹999 get free shipping
  STANDARD_SHIPPING_FEE: 99,    // Flat ₹99 below threshold
  CUSTOM_TEXT_FEE: 199,         // ₹199 for personal text / monogram
  LOGO_PRINTING_FEE: 299,       // ₹299 for custom uploaded logo print
  ADDITIONAL_PLACEMENT_FEE: 150,// ₹150 if custom print on back or multiple placements
  GST_TAX_RATE: 0.05,           // 5% GST on ready-to-wear apparel
};

export function formatINR(amount) {
  if (amount == null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculates authoritative customization fee based on structured design document
 */
export function calculateCustomizationFee(design) {
  if (!design) return 0;
  let fee = 0;

  let hasText = false;
  if (typeof design.textConfig === 'string') {
    try {
      const parsed = JSON.parse(design.textConfig);
      hasText = Boolean(parsed?.text?.trim());
    } catch {
      hasText = false;
    }
  } else if (design.textConfig?.text) {
    hasText = Boolean(design.textConfig.text.trim());
  }

  const hasLogo = Boolean(design.logoAssetId || design.logoUrl);
  const isBackPlacement = design.placement === 'back';

  if (hasText) {
    fee += PRICING_RULES.CUSTOM_TEXT_FEE;
  }
  if (hasLogo) {
    fee += PRICING_RULES.LOGO_PRINTING_FEE;
  }
  if (isBackPlacement && (hasText || hasLogo)) {
    fee += PRICING_RULES.ADDITIONAL_PLACEMENT_FEE;
  }

  return fee;
}

/**
 * Calculates authoritative order totals given cart items and coupon
 */
export function calculateCartTotals(items = [], coupon = null) {
  let subtotal = 0;
  let totalCustomizationFee = 0;

  for (const item of items) {
    const unitPrice = item.variant?.product?.salePrice ?? item.variant?.product?.basePrice ?? item.unitPrice ?? 0;
    const itemPrice = unitPrice + (item.variant?.priceAdjustment ?? 0);
    const customFee = calculateCustomizationFee(item.customDesign);
    const lineTotal = (itemPrice + customFee) * item.quantity;

    subtotal += lineTotal;
    totalCustomizationFee += customFee * item.quantity;
  }

  // Calculate discount from coupon
  let discountAmount = 0;
  if (coupon && coupon.isActive) {
    if (subtotal >= (coupon.minOrderValue || 0)) {
      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else if (coupon.discountType === 'FIXED') {
        discountAmount = Math.min(coupon.discountValue, subtotal);
      }
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  // Shipping
  const shippingFee = discountedSubtotal >= PRICING_RULES.FREE_SHIPPING_THRESHOLD || discountedSubtotal === 0
    ? 0
    : PRICING_RULES.STANDARD_SHIPPING_FEE;

  // Taxes (5% GST included or added based on Indian e-commerce standards)
  const taxAmount = Math.round(discountedSubtotal * PRICING_RULES.GST_TAX_RATE);

  const finalTotal = discountedSubtotal + shippingFee;

  return {
    subtotal,
    totalCustomizationFee,
    discountAmount,
    shippingFee,
    taxAmount,
    finalTotal,
    qualifiesForFreeShipping: discountedSubtotal >= PRICING_RULES.FREE_SHIPPING_THRESHOLD,
    amountNeededForFreeShipping: Math.max(0, PRICING_RULES.FREE_SHIPPING_THRESHOLD - discountedSubtotal),
  };
}
