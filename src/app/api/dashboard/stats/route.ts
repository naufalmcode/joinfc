import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const [events, jerseys, highlights] = await Promise.all([
    prisma.event.count(),
    prisma.jerseyLaunch.count(),
    prisma.highlight.count({ where: { isActive: true } }),
  ]);

  return successResponse({ events, jerseys, highlights });
}
