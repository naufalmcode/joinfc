import { NextRequest } from "next/server";
import { jerseyService } from "@/lib/container";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const launch = await jerseyService.getBySlug(slug);
  if (!launch) return errorResponse("Jersey launch not found", 404);
  const isAdmin = await validateAdminSession();
  if (!isAdmin && !launch.isVisible) return errorResponse("Jersey launch not found", 404);
  return successResponse(launch);
}
