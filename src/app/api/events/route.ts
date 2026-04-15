import { NextRequest } from "next/server";
import { eventService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminSession();
  if (isAdmin) {
    const events = await eventService.getAll();
    return successResponse(events);
  }
  const events = await eventService.getOpen();
  return successResponse(events);
}

export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  if (!body.title || !body.location || !body.eventDate || !body.bankAccount || !body.maxPlayers) {
    return errorResponse("All fields are required");
  }

  const event = await eventService.create({
    ...body,
    eventDate: new Date(body.eventDate),
    maxPlayers: Number(body.maxPlayers),
    maxGoalkeepers: Number(body.maxGoalkeepers || 3),
  });
  return successResponse(event, 201);
}
