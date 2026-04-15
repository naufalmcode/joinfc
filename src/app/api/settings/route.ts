import { NextRequest } from "next/server";
import { settingsService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET() {
  const settings = await settingsService.getSettings();
  return successResponse(settings);
}

export async function PUT(request: NextRequest) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const settings = await settingsService.updateSettings(body);
  return successResponse(settings);
}
