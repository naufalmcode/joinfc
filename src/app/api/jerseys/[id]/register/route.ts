import { NextRequest } from "next/server";
import { jerseyService } from "@/lib/container";
import { successResponse, errorResponse } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  if (!body.name || !body.phone || !body.number) {
    return errorResponse("Name, phone, and number are required");
  }

  try {
    const reg = await jerseyService.register(id, {
      registrantName: body.registrantName || "",
      name: body.name,
      phone: body.phone,
      number: Number(body.number),
      size: body.size || "L",
      jerseyType: body.jerseyType || "player",
      itemType: body.itemType || "set",
      shirtSize: body.shirtSize || "",
    });
    return successResponse(reg, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return errorResponse(message);
  }
}
