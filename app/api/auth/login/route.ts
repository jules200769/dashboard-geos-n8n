import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  getExpectedSessionValue,
  getSessionCookieOptions,
  isAccessCodeConfigured,
} from "@/lib/auth/dashboardSession";
import { verifyAccessCode } from "@/lib/auth/verifyAccessCode";

export async function POST(request: Request) {
  if (!isAccessCodeConfigured()) {
    return NextResponse.json(
      { error: "Dashboardtoegang is niet geconfigureerd." },
      { status: 503 },
    );
  }

  let body: { code?: unknown };
  try {
    body = (await request.json()) as { code?: unknown };
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code : "";
  if (!verifyAccessCode(code)) {
    return NextResponse.json({ error: "Ongeldige toegangscode." }, { status: 401 });
  }

  const sessionValue = await getExpectedSessionValue();
  if (!sessionValue) {
    return NextResponse.json(
      { error: "Dashboardtoegang is niet geconfigureerd." },
      { status: 503 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, sessionValue, getSessionCookieOptions());
  return response;
}
