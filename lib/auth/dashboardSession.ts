const SESSION_SALT = "geos-dashboard-v1";

export const COOKIE_NAME = "geos_dashboard_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface DashboardUser {
  /** Stable owner key stored on every lead and used to scope all queries. */
  id: string;
  /** Personal access code used to log in. */
  code: string;
}

/**
 * Configured dashboard users.
 *
 * Preferred: `DASHBOARD_USERS` as a JSON array, e.g.
 *   [{"id":"maykel","code":"704010"},{"id":"user2","code":"..."}]
 *
 * Fallback (single-user, backwards compatible): `DASHBOARD_ACCESS_CODE`
 * becomes the user with id "default".
 */
export function getDashboardUsers(): DashboardUser[] {
  const raw = process.env.DASHBOARD_USERS;
  if (raw?.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const users: DashboardUser[] = [];
        for (const entry of parsed) {
          if (!entry || typeof entry !== "object") continue;
          const id = String((entry as Record<string, unknown>).id ?? "").trim();
          const code = String((entry as Record<string, unknown>).code ?? "").trim();
          if (id && code) users.push({ id, code });
        }
        if (users.length > 0) return users;
      }
    } catch {
      // Fall through to single-user fallback on malformed JSON.
    }
  }

  const single = process.env.DASHBOARD_ACCESS_CODE;
  if (single?.trim()) {
    return [{ id: "default", code: single }];
  }
  return [];
}

export function isAccessCodeConfigured(): boolean {
  return getDashboardUsers().length > 0;
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

/** Returns the matching user id for a login code, or null when no user matches. */
export function resolveUserByCode(code: string): string | null {
  if (!code) return null;
  let matchedId: string | null = null;
  // Iterate all users (no early return) to keep timing roughly constant.
  for (const user of getDashboardUsers()) {
    if (timingSafeEqualStrings(code, user.code)) {
      matchedId = user.id;
    }
  }
  return matchedId;
}

export async function hashSessionToken(userId: string, code: string): Promise<string> {
  const data = new TextEncoder().encode(`${SESSION_SALT}:${userId}:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Session cookie value for a given user (deterministic hash of id + code). */
export async function getSessionValueForUser(userId: string): Promise<string | null> {
  const user = getDashboardUsers().find((candidate) => candidate.id === userId);
  if (!user) return null;
  return hashSessionToken(user.id, user.code);
}

/** Resolve which user a session cookie belongs to, or null when invalid. */
export async function getUserIdFromSessionCookie(
  cookieValue: string | undefined,
): Promise<string | null> {
  if (!cookieValue) return null;
  let matchedId: string | null = null;
  for (const user of getDashboardUsers()) {
    const expected = await hashSessionToken(user.id, user.code);
    if (timingSafeEqualStrings(cookieValue, expected)) {
      matchedId = user.id;
    }
  }
  return matchedId;
}

export async function isValidSessionCookie(cookieValue: string | undefined): Promise<boolean> {
  return (await getUserIdFromSessionCookie(cookieValue)) !== null;
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
