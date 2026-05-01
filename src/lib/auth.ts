import { cookies } from "next/headers";
import { prisma, jakartaNow } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const ADMIN_COOKIE = "jfc_admin_token";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory session cache (token → expiresAt) to avoid DB hit on every request
const sessionCache = new Map<string, { expiresAt: Date; cachedAt: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

export async function verifyAdminPassword(password: string): Promise<boolean> {
  let settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: "default" } });
  }
  return password === settings.adminPassword;
}

export async function createAdminSession(): Promise<string> {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.adminSession.create({
    data: { token, expiresAt, createdAt: jakartaNow() },
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return token;
}

export async function validateAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  // Check in-memory cache first
  const cached = sessionCache.get(token);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    if (cached.expiresAt < new Date()) {
      sessionCache.delete(token);
      prisma.adminSession.delete({ where: { token } }).catch(() => {});
      return false;
    }
    return true;
  }

  const session = await prisma.adminSession.findUnique({ where: { token } });
  if (!session) {
    sessionCache.delete(token);
    return false;
  }
  if (session.expiresAt < new Date()) {
    sessionCache.delete(token);
    await prisma.adminSession.delete({ where: { token } });
    return false;
  }

  sessionCache.set(token, { expiresAt: session.expiresAt, cachedAt: Date.now() });
  return true;
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token) {
    sessionCache.delete(token);
    await prisma.adminSession.deleteMany({ where: { token } });
  }
  cookieStore.delete(ADMIN_COOKIE);
}
