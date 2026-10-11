import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';

const AUTH_COOKIE = 'threadcraft_token';
const GUEST_COOKIE = 'threadcraft_guest_id';
const AUTH_SECRET = process.env.AUTH_SECRET || 'threadcraft_super_secret_jwt_key_2026_min_32_chars';

export async function hashPassword(plainText) {
  return await bcrypt.hash(plainText, 10);
}

export async function verifyPassword(plainText, hash) {
  return await bcrypt.compare(plainText, hash);
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    AUTH_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, AUTH_SECRET);
  } catch {
    return null;
  }
}

export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    return user;
  } catch (err) {
    if (err?.digest || err?.message?.includes('prerender')) {
      throw err;
    }
    console.error('Error in getSessionUser:', err);
    return null;
  }
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN_ADMIN_REQUIRED');
  }
  return user;
}

export async function getOrCreateGuestSession() {
  const cookieStore = await cookies();
  let guestToken = cookieStore.get(GUEST_COOKIE)?.value;
  if (!guestToken) {
    guestToken = 'gst_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    cookieStore.set(GUEST_COOKIE, guestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
  return guestToken;
}
