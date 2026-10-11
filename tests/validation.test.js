import { describe, it, expect } from 'vitest';
import { 
  registerSchema, 
  loginSchema, 
  addressSchema, 
  addToCartSchema, 
  applyCouponSchema 
} from '../lib/validation/schemas';

describe('Validation Schemas (Zod)', () => {
  it('validates correct registration inputs', () => {
    const valid = {
      name: 'Aditya Sharma',
      email: 'aditya@example.com',
      password: 'SecurePassword123',
    };
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects short password or invalid email', () => {
    const invalidEmail = {
      name: 'Aditya',
      email: 'not-an-email',
      password: '123',
    };
    expect(registerSchema.safeParse(invalidEmail).success).toBe(false);
  });

  it('enforces 6-digit Indian PIN code format in addressSchema', () => {
    const validAddress = {
      fullName: 'Aditya Sharma',
      addressLine1: '42, Indiranagar 100ft Rd',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      phone: '9876543210',
    };
    expect(addressSchema.safeParse(validAddress).success).toBe(true);

    const invalidAddress = {
      ...validAddress,
      postalCode: '123', // invalid PIN
    };
    expect(addressSchema.safeParse(invalidAddress).success).toBe(false);
  });

  it('validates add to cart quantity bounds', () => {
    expect(addToCartSchema.safeParse({ variantId: 'var_1', quantity: 2 }).success).toBe(true);
    expect(addToCartSchema.safeParse({ variantId: 'var_1', quantity: 0 }).success).toBe(false);
    expect(addToCartSchema.safeParse({ variantId: 'var_1', quantity: 25 }).success).toBe(false); // max 20
  });
});
