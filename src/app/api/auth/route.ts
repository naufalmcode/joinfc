import { NextRequest } from "next/server";
import { verifyAdminPassword, createAdminSession, destroyAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password } = body;

  if (!password || typeof password !== "string") {
    return errorResponse("Password is required", 400);
  }

  const valid = await verifyAdminPassword(password);
  if (!valid) {
    return errorResponse("Invalid password", 401);
  }

  await createAdminSession();
  return successResponse({ message: "Login successful" });
}

export async function DELETE() {
  await destroyAdminSession();
  return successResponse({ message: "Logged out" });
}
