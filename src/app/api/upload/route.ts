import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminSession();
  if (!isAdmin) return errorResponse("Unauthorized", 401);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return errorResponse("No file provided");

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return errorResponse("Only image files are allowed");
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return errorResponse("File size must be less than 5MB");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const sanitizedExt = ext.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5);
  const filename = `${uuidv4()}.${sanitizedExt}`;

  await mkdir(UPLOAD_DIR, { recursive: true });

  const bytes = new Uint8Array(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);

  return successResponse({ url: `/uploads/${filename}` }, 201);
}
