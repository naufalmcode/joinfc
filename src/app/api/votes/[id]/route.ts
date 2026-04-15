import { NextRequest } from "next/server";
import { voteService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const vote = await voteService.getById(id);
  if (!vote) return errorResponse("Not found", 404);
  return successResponse(vote);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const vote = await voteService.update(id, body);
  return successResponse(vote);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  await voteService.delete(id);
  return successResponse({ message: "Deleted" });
}
