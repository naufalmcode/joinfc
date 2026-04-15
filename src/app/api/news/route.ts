import { NextRequest } from "next/server";
import { newsService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET() {
  const news = await newsService.getActive();
  return successResponse(news);
}

export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  if (!body.title || !body.content) return errorResponse("Title and content are required");

  const item = await newsService.create(body);
  return successResponse(item, 201);
}
