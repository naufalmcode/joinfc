import { NextRequest } from "next/server";
import { validateAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function PUT(request: NextRequest) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return errorResponse("Current password and new password are required", 400);
  }

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return errorResponse("New password must be at least 6 characters", 400);
  }

  let settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: "default" } });
  }

  if (currentPassword !== settings.adminPassword) {
    return errorResponse("Current password is incorrect", 401);
  }

  await prisma.siteSettings.update({
    where: { id: "default" },
    data: { adminPassword: newPassword },
  });

  return successResponse({ message: "Password updated" });
}
