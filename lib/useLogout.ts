"use client";

import { useCallback } from "react";

/** Logs out via the auth API and hard-redirects to the login page. */
export function useLogout() {
  return useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }, []);
}
