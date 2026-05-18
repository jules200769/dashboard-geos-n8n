"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const configError = searchParams.get("error") === "not_configured";
  const redirectTo = searchParams.get("from") || "/";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        const message =
          payload && typeof payload.error === "string"
            ? payload.error
            : "Inloggen mislukt.";
        setError(message);
        return;
      }

      router.replace(redirectTo.startsWith("/") ? redirectTo : "/");
      router.refresh();
    } catch {
      setError("Kon niet verbinden met de server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center overflow-y-auto bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo-geos.png"
            alt="GEOS Laboratories"
            width={180}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </div>

        <h1 className="text-center text-2xl font-semibold text-zinc-900">Dashboardtoegang</h1>
        <p className="mt-2 text-center text-base text-zinc-600">
          Voer je persoonlijke toegangscode in om verder te gaan.
        </p>

        {configError && (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Dashboardtoegang is niet geconfigureerd. Stel{" "}
            <code className="rounded bg-amber-100 px-1">DASHBOARD_ACCESS_CODE</code> in via{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code> of Vercel.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="access-code" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Toegangscode
            </label>
            <input
              id="access-code"
              name="code"
              type="password"
              autoComplete="current-password"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
              disabled={isSubmitting || configError}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || configError}
            className="w-full rounded-lg bg-violet-600 px-4 py-3 text-base font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Bezig met inloggen…" : "Inloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-zinc-600">
          Laden…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
