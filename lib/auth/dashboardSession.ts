const SESSION_SALT = "geos-dashboard-v1";

export const COOKIE_NAME = "geos_dashboard_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function getAccessCode(): string | null {
  const raw = process.env.DASHBOARD_ACCESS_CODE;
  if (!raw?.trim()) return null;
  return raw;
}

export function isAccessCodeConfigured(): boolean {
  return getAccessCode() !== null;
}

export async function hashSessionToken(accessCode: string): Promise<string> {
  const data = new TextEncoder().encode(`${SESSION_SALT}:${accessCode}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function getExpectedSessionValue(): Promise<string | null> {
  const code = getAccessCode();
  if (!code) return null;
  return hashSessionToken(code);
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function isValidSessionCookie(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await getExpectedSessionValue();
  if (!expected) return false;
  return timingSafeEqualStrings(cookieValue, expected);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function getClearSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
