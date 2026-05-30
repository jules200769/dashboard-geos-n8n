"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useLogout } from "@/lib/useLogout";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  /** Secondary navigation link rendered before the refresh button. */
  navLink: {
    href: string;
    label: string;
    icon: ReactNode;
    /** "primary" = filled brand button, "secondary" = outlined button. */
    variant?: "primary" | "secondary";
  };
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function DashboardHeader({ title, subtitle, navLink, onRefresh, isRefreshing }: DashboardHeaderProps) {
  const logout = useLogout();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { userId?: string } | null) => {
        if (active && data?.userId) setUserId(data.userId);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const navClass =
    navLink.variant === "primary"
      ? "inline-flex items-center gap-2 rounded-lg bg-[#F7941D] px-5 py-2.5 text-base font-medium text-white shadow-sm transition-colors hover:bg-[#E5831A]"
      : "inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-base font-medium text-zinc-700 hover:bg-zinc-50";

  return (
    <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          aria-label="Ga naar dashboard home"
        >
          <Image src="/logo-geos.png" alt="GEOS Laboratories" width={160} height={40} className="h-10 w-auto" priority />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">{title}</h1>
          <p className="text-base text-zinc-600">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {userId && (
          <span className="hidden rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-600 sm:inline-flex">
            Ingelogd als {userId}
          </span>
        )}
        <Link href={navLink.href} className={navClass}>
          {navLink.icon}
          {navLink.label}
        </Link>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-base font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          {isRefreshing ? "Vernieuwen..." : "Vernieuwen"}
        </button>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-base font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
        >
          Uitloggen
        </button>
      </div>
    </header>
  );
}
