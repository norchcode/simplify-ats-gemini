import { NextResponse } from "next/server";

const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/mobile")
  ) {
    return NextResponse.next();
  }

  const ua = request.headers.get("user-agent") || "";
  const isMobile = mobileRegex.test(ua);

  if (isMobile && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/mobile";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"]
};
