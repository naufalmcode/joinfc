import { NextRequest } from "next/server";
import { eventService } from "@/lib/container";
import { successResponse, errorResponse } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  if (!body.name) {
    return errorResponse("Name is required");
  }

  try {
    const result = await eventService.register(id, {
      name: body.name,
      phone: body.phone || "",
      position: body.position || "player",
    });
    return successResponse(result, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return errorResponse(message);
  }
}
