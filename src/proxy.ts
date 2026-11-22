import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic check: no admin cookie → straight to the login page.
// Full DB validation still happens in API routes and in the dashboard shell.
export function proxy(request: NextRequest) {
  const token = request.cookies.get("jfc_admin_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/manage-jfc", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/manage-jfc/dashboard/:path*",
};
