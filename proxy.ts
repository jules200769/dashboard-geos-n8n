import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  COOKIE_NAME,
  isAccessCodeConfigured,
  isValidSessionCookie,
} from "@/lib/auth/dashboardSession";

const PUBLIC_PATHS = new Set(["/login"]);

function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (!isAccessCodeConfigured()) {
    if (isApiPath(pathname)) {
      return NextResponse.json(
        { error: "Dashboardtoegang is niet geconfigureerd." },
        { status: 503 },
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "not_configured");
    return NextResponse.redirect(loginUrl);
  }

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
  if (await isValidSessionCookie(cookieValue)) {
    return NextResponse.next();
  }

  if (isApiPath(pathname)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/webhooks|api/auth).*)",
  ],
};
