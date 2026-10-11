import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  addressLine1: z.string().min(5, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid Indian 6-digit PIN code'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  isDefault: z.boolean().optional(),
});

export const customDesignSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().nullable().optional(),
  designName: z.string().default('My Custom Shirt'),
  placement: z.enum(['front_chest', 'center_front', 'back', 'sleeve']).default('front_chest'),
  shirtColorHex: z.string().default('#FFFFFF'),
  shirtColorName: z.string().default('Classic White'),
  textConfig: z.any().optional(),
  logoAssetId: z.string().nullable().optional(),
  canvasState: z.any().optional(),
  previewUrl: z.string().nullable().optional(),
});

export const addToCartSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  customDesignId: z.string().nullable().optional(),
  quantity: z.number().int().min(1).max(20).default(1),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').toUpperCase(),
});

export const createOrderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(2),
    addressLine1: z.string().min(5),
    addressLine2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(6),
    phone: z.string().min(10),
  }),
  couponCode: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});
