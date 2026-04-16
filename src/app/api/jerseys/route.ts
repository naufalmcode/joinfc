import { NextRequest } from "next/server";
import { jerseyService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const isAdmin = await validateAdminSession();
  if (isAdmin && searchParams.get("summary") === "1") {
    const launches = await jerseyService.getAllSummary();
    return successResponse(launches);
  }
  const launches = await jerseyService.getOpen();
  return successResponse(launches);
}

export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  if (!body.title) return errorResponse("Title is required");

  const launch = await jerseyService.create(body);
  return successResponse(launch, 201);
}
