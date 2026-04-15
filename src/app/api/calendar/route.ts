import { NextRequest } from "next/server";
import { calendarService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET() {
  const schedules = await calendarService.getUpcoming();
  return successResponse(schedules);
}

export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  if (!body.title || !body.eventDate) return errorResponse("Title and date are required");

  const schedule = await calendarService.create({
    ...body,
    eventDate: new Date(body.eventDate),
  });
  return successResponse(schedule, 201);
}
