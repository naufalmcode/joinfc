import { NextRequest } from "next/server";
import { jerseyService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const launch = await jerseyService.getById(id);
  if (!launch) return errorResponse("Jersey launch not found", 404);
  return successResponse(launch);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const allowed: Record<string, unknown> = {};
  const allowedKeys = ["title", "designUrls", "status", "isVisible", "basePrice", "shirtOnlyPrice", "shortsOnlyPrice", "sizeSurcharges"];
  for (const key of allowedKeys) {
    if (key in body) allowed[key] = body[key];
  }
  const launch = await jerseyService.update(id, allowed);
  return successResponse(launch);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  await jerseyService.delete(id);
  return successResponse({ message: "Deleted" });
}
