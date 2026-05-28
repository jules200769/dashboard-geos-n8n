"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { LeadRecord } from "@/lib/types";

const iconClass = "h-4 w-4 shrink-0 text-zinc-500";

const GmailIcon = (
  <Image
    src="/gmail-logo.png"
    alt=""
    width={64}
    height={21}
    className="h-3 w-auto max-w-[2.5rem] shrink-0 object-contain"
    aria-hidden
  />
);

const PhoneIcon = (
  <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const GlobeIcon = (
  <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

const BuildingIcon = (
  <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);

const CalendarIcon = (
  <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const SentimentIcon = (
  <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M13 2 3 14h9l-1 8 11-12h-9l1-8z" />
  </svg>
);

function ContactRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="sr-only">{label}: </span>
      {icon}
      <span className="min-w-0 truncate text-sm text-zinc-600">{children}</span>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <div>
        <p className="text-xs text-zinc-400">{label}</p>
        <p className="text-sm font-medium text-zinc-800">{value}</p>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function displayEmail(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "-";
  const match = trimmed.match(/<([^>]+)>/);
  return (match?.[1] ?? trimmed).trim() || "-";
}

function formatIndustryLabel(industry: string): string {
  if (!industry || industry === "diverse") return "";
  return industry
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "onbekend";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "zojuist";
  if (diffMinutes < 60) return `${diffMinutes} min geleden`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return diffHours === 1 ? "1 uur geleden" : `${diffHours} uur geleden`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 dag geleden";
  return `${diffDays} dagen geleden`;
}

function formatSentimentLabel(sentiment: string, confidence: string): string {
  const labels: Record<string, string> = {
    Positive: "Positief",
    Negative: "Negatief",
    Neutral: "Neutraal",
    Unknown: "Onbekend",
  };
  const label = labels[sentiment] ?? sentiment;
  const raw = confidence.trim();
  if (!raw || raw === "N/A") return label;
  const numeric = Number(raw);
  if (Number.isNaN(numeric)) return label;
  const pct = numeric <= 1 ? Math.round(numeric * 100) : Math.round(numeric);
  return `${label} (${pct}%)`;
}

interface LeadCardProps {
  lead: LeadRecord;
  onOpen: (lead: LeadRecord) => void;
  onIgnore: (lead: LeadRecord) => void;
  onRecheck: (lead: LeadRecord) => void;
  isSaving: boolean;
  isIgnoring: boolean;
  isRechecking: boolean;
  hideActions?: boolean;
  /** "queue" = open review actions; "history" = saved card with an edit action. */
  variant?: "queue" | "history";
  /** Open the card to correct an already-saved lead (history variant). */
  onEdit?: (lead: LeadRecord) => void;
}

export function LeadCard({
  lead,
  onOpen,
  onIgnore,
  onRecheck,
  isSaving,
  isIgnoring,
  isRechecking,
  hideActions,
  variant = "queue",
  onEdit,
}: LeadCardProps) {
  const isHistory = variant === "history";
  const primaryActionLabel =
    lead.salesforce_mode === "create_contact_under_existing_account"
      ? "Contact maken"
      : "Volgende";
  const contactName = lead.contact_name || "Onbekende contactpersoon";
  const industryLabel = formatIndustryLabel(lead.industry);
  const urgencyHigh = lead.urgency_score >= 7;
  const urgencyMid = lead.urgency_score >= 4 && !urgencyHigh;
  const urgencyBadgeClass = urgencyHigh
    ? "bg-red-50 text-red-600"
    : urgencyMid
      ? "bg-amber-50 text-amber-700"
      : "bg-emerald-50 text-emerald-700";
  const urgencyDotClass = urgencyHigh ? "bg-red-500" : urgencyMid ? "bg-amber-500" : "bg-emerald-500";
  const phoneDisplay = lead.phone_number
    ? lead.phone_country_code
      ? `${lead.phone_country_code} ${lead.phone_number}`
      : lead.phone_number
    : "-";
  const sentimentDisplay = formatSentimentLabel(lead.sentiment, lead.sentiment_confidence);

  return (
    <article
      className={`rounded-2xl border bg-white p-6 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] transition-all duration-300 ${
        isRechecking
          ? "border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-pulse"
          : "border-zinc-200/80"
      }`}
    >
      <header className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-800"
          aria-hidden
        >
          {getInitials(contactName)}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="text-xl font-semibold leading-tight text-zinc-900">{contactName}</h3>
          <p className="mt-0.5 truncate text-sm text-zinc-500">{lead.org_name || "Onbekend bedrijf"}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {isHistory ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200/70">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              In Salesforce
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${urgencyBadgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${urgencyDotClass}`} aria-hidden />
              Urgentie {lead.urgency_score}
            </span>
          )}
          {industryLabel ? (
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
              {industryLabel}
            </span>
          ) : null}
        </div>
      </header>

      <hr className="my-4 border-zinc-100" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] sm:items-center">
        <div className="space-y-2.5">
          <ContactRow icon={GmailIcon} label="E-mail">
            {displayEmail(lead.sender_email)}
          </ContactRow>
          <ContactRow icon={PhoneIcon} label="Telefoon">
            {phoneDisplay}
          </ContactRow>
          <ContactRow icon={GlobeIcon} label="Domein">
            {lead.sender_domain || "-"}
          </ContactRow>
          {lead.salesforce_mode === "create_contact_under_existing_account" ? (
            <ContactRow icon={BuildingIcon} label="Account">
              {lead.account_name || lead.matched_account_name || "gevonden Account"}
            </ContactRow>
          ) : null}
        </div>

        <hr className="border-zinc-100 sm:hidden" />

        <div className="hidden w-px self-center bg-zinc-100 sm:block sm:h-[calc(100%-0.5rem)] sm:min-h-[4.5rem]" aria-hidden />

        <div className="flex flex-col gap-3 sm:py-1">
          <MetaRow
            icon={CalendarIcon}
            label={isHistory ? "Opgeslagen" : "Ontvangen"}
            value={formatRelativeTime(isHistory ? lead.saved_at ?? lead.updated_at : lead.created_at)}
          />
          <hr className="border-zinc-100" />
          <MetaRow icon={SentimentIcon} label="Sentiment" value={sentimentDisplay} />
        </div>
      </div>

      {!hideActions && isHistory ? (
        <footer className="mt-5 flex items-stretch gap-2">
          <button
            type="button"
            disabled={isIgnoring}
            onClick={() => onIgnore(lead)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            title="Uit geschiedenis verwijderen (Salesforce blijft ongewijzigd)"
          >
            <svg className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            {isIgnoring ? "Verwijderen..." : "Verwijderen"}
          </button>
          <button
            type="button"
            onClick={() => onEdit?.(lead)}
            className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <svg className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Bewerken
          </button>
        </footer>
      ) : null}

      {!hideActions && !isHistory ? (
        <footer className="mt-5 flex items-stretch gap-2">
          <button
            type="button"
            disabled={isIgnoring}
            onClick={() => onIgnore(lead)}
            className="inline-flex min-w-[8.25rem] items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <path d="m4.9 4.9 14.2 14.2" />
            </svg>
            {isIgnoring ? "Verwijderen..." : "Negeer"}
          </button>
          <button
            type="button"
            disabled={isSaving || lead.status === "saved"}
            onClick={() => onOpen(lead)}
            className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {lead.status === "saved" ? "Opgeslagen" : isSaving ? "Bezig met opslaan..." : primaryActionLabel}
            {lead.status !== "saved" && !isSaving ? (
              <svg className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            ) : null}
          </button>
          <button
            type="button"
            disabled={isRechecking}
            onClick={() => onRecheck(lead)}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-sky-400 transition-colors hover:bg-sky-50 hover:text-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
            title={isRechecking ? "Salesforce-controle bezig" : "Salesforce opnieuw controleren"}
            aria-label={isRechecking ? "Salesforce-controle bezig" : "Salesforce opnieuw controleren"}
          >
            <svg
              className={`h-5 w-5 ${isRechecking ? "animate-spin" : ""}`}
              xmlns="http://www.w3.org/2000/svg"
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
          </button>
        </footer>
      ) : null}
    </article>
  );
}
