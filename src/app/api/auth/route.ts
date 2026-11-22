import { NextRequest } from "next/server";
import { verifyAdminPassword, createAdminSession, destroyAdminSession, validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

// Session status check used by the admin dashboard
export async function GET() {
  const valid = await validateAdminSession();
  if (!valid) return errorResponse("Unauthorized", 401);
  return successResponse({ authenticated: true });
}

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
