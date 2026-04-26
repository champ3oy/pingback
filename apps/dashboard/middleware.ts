import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("pingback_access_token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (token) {
      const plan = request.nextUrl.searchParams.get("plan");
      if (plan === "pro" || plan === "team") {
        return NextResponse.redirect(new URL(`/account?checkout=${plan}`, request.url));
      }
      return NextResponse.redirect(new URL("/projects", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  if (!token) {
    const refreshToken = request.cookies.get("pingback_refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Access token expired but refresh token exists — let through.
    // The client-side API will handle 401 → refresh → retry.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
