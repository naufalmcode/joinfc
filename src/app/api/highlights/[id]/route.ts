import { NextRequest } from "next/server";
import { highlightService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const highlight = await highlightService.update(id, body);
  return successResponse(highlight);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  await highlightService.delete(id);
  return successResponse({ message: "Deleted" });
}
