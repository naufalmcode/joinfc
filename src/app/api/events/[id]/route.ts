import { NextRequest } from "next/server";
import { eventService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const event = await eventService.getById(id);
  if (!event) return errorResponse("Event not found", 404);
  return successResponse(event);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  if (body.eventDate) body.eventDate = new Date(body.eventDate);
  if (body.maxPlayers) body.maxPlayers = Number(body.maxPlayers);
  if (body.maxGoalkeepers) body.maxGoalkeepers = Number(body.maxGoalkeepers);
  const event = await eventService.update(id, body);
  return successResponse(event);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  await eventService.delete(id);
  return successResponse({ message: "Deleted" });
}
