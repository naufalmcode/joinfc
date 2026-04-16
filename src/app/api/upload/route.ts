import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { v4 as uuidv4 } from "uuid";
import { put } from "@vercel/blob";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Try standard session validation first
  let isAdmin = await validateAdminSession();
  
  // Fallback: check cookie from request directly (workaround for multipart requests)
  if (!isAdmin) {
    const token = request.cookies.get("jfc_admin_token")?.value;
    if (token) {
      const { prisma } = await import("@/lib/db/prisma");
      const session = await prisma.adminSession.findUnique({ where: { token } });
      if (session && session.expiresAt > new Date()) {
        isAdmin = true;
      }
    }
  }
  
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return errorResponse("No file provided");

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return errorResponse("Only image files are allowed");
  }

  const maxSize = 20 * 1024 * 1024; // 20MB (upscaled UHD images can be large)
  if (file.size > maxSize) {
    return errorResponse("File size must be less than 20MB");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const sanitizedExt = ext.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5);
  const filename = `${uuidv4()}.${sanitizedExt}`;

  try {
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return successResponse({ url: blob.url }, 201);
  } catch (err) {
    console.error("Upload error:", err);
    return errorResponse("Upload failed. Make sure BLOB_READ_WRITE_TOKEN is configured.", 500);
  }
}
