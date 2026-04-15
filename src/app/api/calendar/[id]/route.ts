import { NextRequest } from "next/server";
import { calendarService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  if (body.eventDate) body.eventDate = new Date(body.eventDate);
  const schedule = await calendarService.update(id, body);
  return successResponse(schedule);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  await calendarService.delete(id);
  return successResponse({ message: "Deleted" });
}
