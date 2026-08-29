import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Protect /admin routes (except /admin/login)
  if (path.startsWith("/admin") && path !== "/admin/login") {
    // Secret dibaca dari env saja — nilai cadangan hardcoded di sini akan
    // membuat middleware menerima token yang ditandatangani rahasia publik.
    const token = await getToken({
      req,
      secret:
        process.env.NEXTAUTH_SECRET ||
        (process.env.NODE_ENV === "production"
          ? undefined
          : "dev-only-insecure-secret-do-not-use-in-production"),
    });

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
