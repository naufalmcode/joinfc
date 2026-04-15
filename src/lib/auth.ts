import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const ADMIN_COOKIE = "jfc_admin_token";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

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
    data: { token, expiresAt },
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

  const session = await prisma.adminSession.findUnique({ where: { token } });
  if (!session) return false;
  if (session.expiresAt < new Date()) {
    await prisma.adminSession.delete({ where: { token } });
    return false;
  }

  return true;
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token) {
    await prisma.adminSession.deleteMany({ where: { token } });
  }
  cookieStore.delete(ADMIN_COOKIE);
}
