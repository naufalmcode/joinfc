import { NextRequest } from "next/server";
import { eventService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

type Params = { params: Promise<{ regId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const { regId } = await params;
  const body = await request.json();

  const updateData: { status?: string; position?: string } = {};
  if (body.status) updateData.status = body.status;
  if (body.position) updateData.position = body.position;

  try {
    const registration = await eventService.updateRegistration(regId, updateData);
    return successResponse(registration);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    return errorResponse(message);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const { regId } = await params;

  try {
    await eventService.removeRegistration(regId);
    return successResponse({ message: "Deleted" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return errorResponse(message);
  }
}
