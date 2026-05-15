import { NextResponse } from "next/server";
import { COOKIE_NAME, getClearSessionCookieOptions } from "@/lib/auth/dashboardSession";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", getClearSessionCookieOptions());
  return response;
}
