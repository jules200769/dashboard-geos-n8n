import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  getSessionValueForUser,
  getSessionCookieOptions,
  isAccessCodeConfigured,
  resolveUserByCode,
} from "@/lib/auth/dashboardSession";

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
  const userId = resolveUserByCode(code);
  if (!userId) {
    return NextResponse.json({ error: "Ongeldige toegangscode." }, { status: 401 });
  }

  const sessionValue = await getSessionValueForUser(userId);
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
