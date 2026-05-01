"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { LeadRecord, SalesforceMode } from "@/lib/types";
import { INDUSTRY_OPTIONS } from "@/lib/types";

const fieldBase =
  "w-full rounded-2xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] placeholder:text-zinc-400 transition-all duration-200 ease-out focus:border-zinc-300 focus:outline-none focus:ring-[3px] focus:ring-sky-500/15";

function IndustrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: LeadRecord["industry"]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-2xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-left text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out hover:bg-zinc-50/80 focus:outline-none focus:ring-[3px] focus:ring-sky-500/15"
      >
        <span>
          <span className="text-xs font-medium text-zinc-500">Industrie: </span>
          {value || "diverse"}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="max-h-48 overflow-y-auto rounded-2xl border border-zinc-200/80 bg-white/95 py-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.03] backdrop-blur-md animate-[fade-in_0.15s_ease-out]">
          {INDUSTRY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 text-left text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                value === option ? "bg-zinc-100/90 font-medium text-zinc-900" : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface LeadDetailDrawerProps {
  lead: LeadRecord | null;
  open: boolean;
  onClose: () => void;
  onChange: (next: LeadRecord) => void;
  onSave: (lead: LeadRecord) => void;
  isSaving: boolean;
}

type ReviewStep = "account" | "contact";

function getInitialStep(lead: LeadRecord | null): ReviewStep {
  return lead?.salesforce_mode === "create_contact_under_existing_account" ? "contact" : "account";
}

function accountModeLabel(mode?: SalesforceMode): string {
  return mode === "create_contact_under_existing_account"
    ? "Contact onder bestaand Account"
    : "Nieuw Account en daarna Contact";
}

export function LeadDetailDrawer({
  lead,
  open,
  onClose,
  onChange,
  onSave,
  isSaving,
}: LeadDetailDrawerProps) {
  const [draft, setDraft] = useState<LeadRecord | null>(lead);
  const [step, setStep] = useState<ReviewStep>(getInitialStep(lead));
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setDraft(lead);
    setStep(getInitialStep(lead));
  }, [lead]);

  useEffect(() => {
    setIsClosing(false);
  }, [open, lead?.id]);

  useEffect(() => {
    if (!open || !isClosing) return;
    const id = window.setTimeout(() => {
      onClose();
    }, 250);
    return () => window.clearTimeout(id);
  }, [open, isClosing, onClose]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [open]);

  if (!open || !draft) return null;

  const requestClose = () => {
    setIsClosing((prev) => (prev ? prev : true));
  };

  const update = <K extends keyof LeadRecord>(key: K, value: LeadRecord[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    onChange(next);
  };

  const hasEmailBody = Boolean(draft.email_body?.trim());
  const usesExistingAccount = draft.salesforce_mode === "create_contact_under_existing_account";
  const canGoToContact = usesExistingAccount || step === "contact";

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center overflow-y-auto overscroll-y-contain bg-zinc-950/25 p-4 backdrop-blur-md sm:p-6 ${
        isClosing ? "pointer-events-none animate-fade-out" : "animate-fade-in"
      }`}
      onClick={requestClose}
    >
      <aside
        className={`flex max-h-[min(92vh,56rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white/95 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.06)] ring-1 ring-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/88 ${
          isClosing ? "pointer-events-none animate-modal-out" : "animate-modal-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200/70 bg-gradient-to-b from-zinc-50/90 to-white/80 px-6 py-5 backdrop-blur-sm">
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Leadreview</h2>
            <p className="text-sm leading-snug text-zinc-500">{accountModeLabel(draft.salesforce_mode)}</p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="group flex shrink-0 items-center gap-2 rounded-full bg-zinc-100/90 px-4 py-2 text-sm font-medium text-zinc-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-colors hover:bg-zinc-200/90 focus:outline-none focus:ring-[3px] focus:ring-sky-500/20"
            aria-label="Sluiten"
          >
            <span className="hidden sm:inline">Sluiten</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-zinc-500 shadow-sm group-hover:text-zinc-800">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </button>
        </div>

        {/* Two-column body */}
        <div className="flex min-h-0 flex-1">
          {/* Left column — Original email */}
          <div className="flex w-1/2 flex-col border-r border-zinc-200/60 bg-zinc-50/40">
            <div className="shrink-0 border-b border-zinc-200/50 bg-zinc-100/30 px-6 py-3.5">
              <h3 className="flex flex-wrap items-center gap-2.5 text-[13px] font-semibold tracking-wide text-zinc-700">
                <span>Bronmail</span>
                <Image
                  src="/gmail-logo.png"
                  alt="Gmail"
                  width={64}
                  height={21}
                  className="h-4 w-auto max-w-[5.25rem] object-contain opacity-90"
                />
              </h3>
            </div>

            {hasEmailBody ? (
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="mb-4 space-y-1.5 text-sm text-zinc-600">
                  <p>
                    <span className="font-medium text-zinc-700">Onderwerp:</span>{" "}
                    {draft.subject || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-zinc-700">Van:</span>{" "}
                    {draft.sender_email || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-zinc-800">
                    {draft.email_body}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6">
                <p className="text-center text-sm text-zinc-400">
                  Geen bronmail beschikbaar voor deze lead.
                </p>
              </div>
            )}
          </div>

          {/* Right column — Editable fields + context */}
          <div className="flex w-1/2 flex-col bg-white/50">
            <div className="shrink-0 border-b border-zinc-200/50 bg-white/60 px-6 py-3.5 backdrop-blur-sm">
              <h3 className="text-[13px] font-semibold tracking-wide text-zinc-700">
                {canGoToContact ? "Contactgegevens" : "Accountgegevens"}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {!usesExistingAccount && (
                <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100/90 p-1 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
                  <button
                    type="button"
                    onClick={() => setStep("account")}
                    className={`rounded-xl px-3 py-2.5 font-medium transition-all duration-200 ease-out ${
                      step === "account"
                        ? "bg-white text-zinc-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("contact")}
                    className={`rounded-xl px-3 py-2.5 font-medium transition-all duration-200 ease-out ${
                      step === "contact"
                        ? "bg-white text-zinc-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    Contact
                  </button>
                </div>
              )}

              {step === "account" && !usesExistingAccount ? (
                <div className="grid grid-cols-1 gap-4">
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">Account name</span>
                    <input
                      value={draft.account_name || draft.org_name}
                      onChange={(event) => update("account_name", event.target.value)}
                      className={fieldBase}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">Account nummer</span>
                    <input
                      value={draft.account_number ?? ""}
                      onChange={(event) => update("account_number", event.target.value)}
                      placeholder="optioneel"
                      className={fieldBase}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">Domein / website</span>
                    <input
                      value={draft.sender_domain}
                      onChange={(event) => update("sender_domain", event.target.value)}
                      className={fieldBase}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">Description</span>
                    <textarea
                      value={draft.account_description ?? ""}
                      onChange={(event) => update("account_description", event.target.value)}
                      className={`min-h-28 ${fieldBase}`}
                    />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {usesExistingAccount && (
                    <label className="space-y-1.5">
                      <span className="text-xs font-medium text-zinc-500">Account name</span>
                      <input
                        value={draft.account_name || draft.matched_account_name || draft.org_name}
                        onChange={(event) => update("account_name", event.target.value)}
                        className={fieldBase}
                      />
                    </label>
                  )}
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">Naam</span>
                    <input
                      value={draft.contact_name}
                      onChange={(event) => update("contact_name", event.target.value)}
                      className={fieldBase}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">Bedrijf</span>
                    <input
                      value={draft.org_name}
                      onChange={(event) => update("org_name", event.target.value)}
                      className={fieldBase}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">E-mail</span>
                    <input
                      value={draft.sender_email}
                      onChange={(event) => update("sender_email", event.target.value)}
                      className={fieldBase}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">Telefoonnummer</span>
                    <div className="flex gap-2">
                      <select
                        value={draft.phone_country_code || "+32"}
                        onChange={(event) => update("phone_country_code", event.target.value)}
                        className={`shrink-0 ${fieldBase}`}
                      >
                        <option value="+32">+32 (BE)</option>
                        <option value="+31">+31 (NL)</option>
                        <option value="+33">+33 (FR)</option>
                        <option value="+49">+49 (DE)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+1">+1 (US/CA)</option>
                      </select>
                      <input
                        value={draft.phone_number || ""}
                        onChange={(event) => update("phone_number", event.target.value)}
                        placeholder="onbekend"
                        className={fieldBase}
                      />
                    </div>
                  </label>
                  <IndustrySelect
                    value={draft.industry}
                    onChange={(val) => update("industry", val)}
                  />
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">Aanbevolen actie / Contact description</span>
                    <textarea
                      value={draft.suggested_action}
                      onChange={(event) => update("suggested_action", event.target.value)}
                      className={`min-h-24 ${fieldBase}`}
                    />
                  </label>
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-zinc-200/70 bg-gradient-to-b from-zinc-50/80 to-zinc-50/40 p-4 text-sm leading-relaxed text-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                <p className="font-semibold text-zinc-900">Context voor Salesforce review</p>
                <p className="mt-2">Leadscore: {draft.lead_rating}</p>
                <p>Intentie: {draft.intent || "-"}</p>
                <p>Industrie: {draft.industry || "diverse"}</p>
                <p>Hoofdonderwerp: {draft.primary_topic || "-"}</p>
                <p>Salesforce actie: {accountModeLabel(draft.salesforce_mode)}</p>
                {usesExistingAccount && (
                  <p>
                    Contact wordt gekoppeld aan:{" "}
                    {draft.account_name || draft.matched_account_name || draft.org_name || "gevonden Account"}
                    {draft.matched_account_id ? ` (${draft.matched_account_id})` : ""}
                  </p>
                )}
                <p>Match gevonden in: {draft.matched_in.join(", ") || "Geen overeenkomst"}</p>
                <p>Reden not-found: {draft.match_reason || "Niet gevonden in Salesforce"}</p>
              </div>

              {step === "account" && !usesExistingAccount ? (
                <button
                  type="button"
                  onClick={() => setStep("contact")}
                  className="mt-6 w-full rounded-2xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.45)] transition-all duration-150 ease-out active:scale-[0.99] active:shadow-md"
                >
                  Volgende
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSave(draft)}
                  disabled={isSaving || draft.status === "saved"}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.45)] transition-all duration-150 ease-out active:scale-[0.99] active:shadow-md disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:shadow-none disabled:active:scale-100"
                >
                  {draft.status === "saved" ? (
                    <>
                      <span>Opgeslagen in</span>
                      <Image
                        src="/salesforce-logo.png"
                        alt="Salesforce"
                        width={96}
                        height={32}
                        className="h-7 w-auto max-w-[7.5rem] object-contain"
                      />
                    </>
                  ) : isSaving ? (
                    "Bezig met opslaan..."
                  ) : (
                    <>
                      <span>{usesExistingAccount ? "Opslaan als contact in" : "Opslaan in"}</span>
                      <Image
                        src="/salesforce-logo.png"
                        alt="Salesforce"
                        width={96}
                        height={32}
                        className="h-7 w-auto max-w-[7.5rem] object-contain"
                      />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
