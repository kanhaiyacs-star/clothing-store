import { describe, it, expect } from 'vitest';
import { calculateCustomizationFee, calculateCartTotals, PRICING_RULES } from '../lib/pricing';

describe('Pricing Engine', () => {
  it('calculates zero customization fee for standard shirt without personalization', () => {
    const fee = calculateCustomizationFee(null);
    expect(fee).toBe(0);
  });

  it('calculates customization fee for custom text', () => {
    const design = {
      textConfig: JSON.stringify({ text: 'A.S.' }),
      placement: 'front_chest',
    };
    const fee = calculateCustomizationFee(design);
    expect(fee).toBe(PRICING_RULES.CUSTOM_TEXT_FEE); // 199
  });

  it('calculates customization fee for uploaded logo', () => {
    const design = {
      logoAssetId: 'asset_123',
      placement: 'front_chest',
    };
    const fee = calculateCustomizationFee(design);
    expect(fee).toBe(PRICING_RULES.LOGO_PRINTING_FEE); // 299
  });

  it('adds additional placement fee for back placement with text and logo', () => {
    const design = {
      textConfig: JSON.stringify({ text: 'ThreadCraft 2026' }),
      logoAssetId: 'asset_123',
      placement: 'back',
    };
    const fee = calculateCustomizationFee(design);
    // 199 (text) + 299 (logo) + 150 (back placement) = 648
    expect(fee).toBe(199 + 299 + 150);
  });

  it('calculates free shipping when total is above threshold (₹999)', () => {
    const items = [
      {
        unitPrice: 1999,
        quantity: 1,
        variant: { product: { basePrice: 1999 } },
      },
    ];
    const totals = calculateCartTotals(items, null);
    expect(totals.subtotal).toBe(1999);
    expect(totals.shippingFee).toBe(0);
    expect(totals.finalTotal).toBe(1999);
  });

  it('adds standard shipping fee (₹99) when total is below threshold', () => {
    const items = [
      {
        unitPrice: 499,
        quantity: 1,
        variant: { product: { basePrice: 499 } },
      },
    ];
    const totals = calculateCartTotals(items, null);
    expect(totals.subtotal).toBe(499);
    expect(totals.shippingFee).toBe(PRICING_RULES.STANDARD_SHIPPING_FEE);
    expect(totals.finalTotal).toBe(499 + PRICING_RULES.STANDARD_SHIPPING_FEE);
  });

  it('applies percentage coupon with max discount cap accurately', () => {
    const items = [
      {
        unitPrice: 3000,
        quantity: 1,
        variant: { product: { basePrice: 3000 } },
      },
    ];
    const coupon = {
      code: 'THREAD10',
      isActive: true,
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 999,
      maxDiscount: 200, // Capped at ₹200
    };
    const totals = calculateCartTotals(items, coupon);
    expect(totals.discountAmount).toBe(200);
    expect(totals.finalTotal).toBe(2800);
  });
});
