import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isSiteEnabled() {
  return process.env.SITE_ENABLED === "true";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap")
  ) {
    return NextResponse.next();
  }

  if (isSiteEnabled()) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_DISABLED",
        message: "站点当前已关闭，请稍后再试。",
      },
      { status: 503 },
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = "/maintenance";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};

