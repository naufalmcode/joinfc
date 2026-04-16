import { NextRequest } from "next/server";
import { jerseyService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();

  // Only allow specific fields to be updated
  const allowed: Record<string, unknown> = {};
  if (body.registrantName !== undefined) allowed.registrantName = String(body.registrantName);
  if (body.name !== undefined) allowed.name = String(body.name);
  if (body.phone !== undefined) allowed.phone = String(body.phone);
  if (body.number !== undefined) allowed.number = Number(body.number);
  if (body.size !== undefined) allowed.size = String(body.size);
  if (body.shirtSize !== undefined) allowed.shirtSize = String(body.shirtSize);
  if (body.jerseyType !== undefined) allowed.jerseyType = String(body.jerseyType);
  if (body.itemType !== undefined) allowed.itemType = String(body.itemType);
  if (body.totalPrice !== undefined) allowed.totalPrice = Number(body.totalPrice);
  if (body.paymentStatus !== undefined) allowed.paymentStatus = String(body.paymentStatus);

  try {
    const reg = await jerseyService.updateRegistration(id, allowed);
    return successResponse(reg);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    return errorResponse(message);
  }
}
