import { NextRequest } from "next/server";
import { voteService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET() {
  const votes = await voteService.getAll();
  return successResponse(votes);
}

export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  if (!body.title) return errorResponse("Title is required");

  const vote = await voteService.create({
    title: body.title,
    options: body.options || [],
  });
  return successResponse(vote, 201);
}
