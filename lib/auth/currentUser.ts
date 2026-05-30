import { cookies } from "next/headers";
import { COOKIE_NAME, getUserIdFromSessionCookie } from "./dashboardSession";

/**
 * Resolve the owner key of the currently logged-in dashboard user from the
 * session cookie. Returns null when there is no valid session.
 *
 * Use this in API route handlers to scope every query/mutation to the caller.
 */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(COOKIE_NAME)?.value;
  return getUserIdFromSessionCookie(cookieValue);
}
