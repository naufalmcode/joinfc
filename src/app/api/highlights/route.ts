import { NextRequest } from "next/server";
import { highlightService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET() {
  const highlights = await highlightService.getActive();
  return successResponse(highlights);
}

export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  if (!body.title) return errorResponse("Title is required");

  const highlight = await highlightService.create(body);
  return successResponse(highlight, 201);
}
