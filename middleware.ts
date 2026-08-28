import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Protect /admin routes (except /admin/login)
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "uc_centers_super_secret_jwt_key_32_chars_min" });

    if (!token) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
