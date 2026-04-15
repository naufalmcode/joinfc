import { NextRequest } from "next/server";
import { voteService } from "@/lib/container";
import { successResponse, errorResponse } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  if (!body.optionId) return errorResponse("Option is required");

  try {
    const response = await voteService.castVote(id, body.optionId);
    return successResponse(response, 201);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to vote";
    return errorResponse(message, 400);
  }
}
