"use client";

import { useEffect, useState } from "react";
import type { LeadRecord, SalesforceMode } from "@/lib/types";
import { INDUSTRY_OPTIONS } from "@/lib/types";

function IndustrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: LeadRecord["industry"]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-50"
      >
        <span>
          <span className="text-xs font-medium text-zinc-600">Industrie: </span>
          {value || "diverse"}
        </span>
        <svg
          className={`h-4 w-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
          {INDUSTRY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 ${
                value === option ? "bg-zinc-100 font-medium text-zinc-900" : "text-zinc-700"
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

  useEffect(() => {
    setDraft(lead);
    setStep(getInitialStep(lead));
  }, [lead]);

  if (!open || !draft) return null;

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
      className="fixed inset-0 z-40 flex justify-end bg-black/35"
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Leadreview</h2>
            <p className="text-sm text-zinc-500">{accountModeLabel(draft.salesforce_mode)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Sluiten
          </button>
        </div>

        {/* Two-column body */}
        <div className="flex min-h-0 flex-1">
          {/* Left column — Original email */}
          <div className="flex w-1/2 flex-col border-r border-zinc-200">
            <div className="shrink-0 border-b border-zinc-100 bg-zinc-50 px-6 py-3">
              <h3 className="text-sm font-semibold text-zinc-800">Bronmail</h3>
            </div>

            {hasEmailBody ? (
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="mb-3 space-y-1 text-sm text-zinc-600">
                  <p>
                    <span className="font-medium text-zinc-700">Onderwerp:</span>{" "}
                    {draft.subject || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-zinc-700">Van:</span>{" "}
                    {draft.sender_email || "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-zinc-800">
                    {draft.email_body}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6">
                <p className="text-sm text-zinc-400">
                  Geen bronmail beschikbaar voor deze lead.
                </p>
              </div>
            )}
          </div>

          {/* Right column — Editable fields + context */}
          <div className="flex w-1/2 flex-col">
            <div className="shrink-0 border-b border-zinc-100 bg-zinc-50 px-6 py-3">
              <h3 className="text-sm font-semibold text-zinc-800">
                {canGoToContact ? "Contactgegevens" : "Accountgegevens"}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!usesExistingAccount && (
                <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setStep("account")}
                    className={`rounded-lg px-3 py-2 font-medium ${
                      step === "account"
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("contact")}
                    className={`rounded-lg px-3 py-2 font-medium ${
                      step === "contact" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    Contact
                  </button>
                </div>
              )}

              {step === "account" && !usesExistingAccount ? (
                <div className="grid grid-cols-1 gap-4">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-zinc-600">Account name</span>
                    <input
                      value={draft.account_name || draft.org_name}
                      onChange={(event) => update("account_name", event.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-zinc-600">Account nummer</span>
                    <input
                      value={draft.account_number ?? ""}
                      onChange={(event) => update("account_number", event.target.value)}
                      placeholder="optioneel"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-zinc-600">Domein / website</span>
                    <input
                      value={draft.sender_domain}
                      onChange={(event) => update("sender_domain", event.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-zinc-600">Description</span>
                    <textarea
                      value={draft.account_description ?? ""}
                      onChange={(event) => update("account_description", event.target.value)}
                      className="min-h-28 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                    />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {usesExistingAccount && (
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-zinc-600">Account name</span>
                      <input
                        value={draft.account_name || draft.matched_account_name || draft.org_name}
                        onChange={(event) => update("account_name", event.target.value)}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                      />
                    </label>
                  )}
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-zinc-600">Naam</span>
                    <input
                      value={draft.contact_name}
                      onChange={(event) => update("contact_name", event.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-zinc-600">Bedrijf</span>
                    <input
                      value={draft.org_name}
                      onChange={(event) => update("org_name", event.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-zinc-600">E-mail</span>
                    <input
                      value={draft.sender_email}
                      onChange={(event) => update("sender_email", event.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-zinc-600">Telefoonnummer</span>
                    <div className="flex gap-2">
                      <select
                        value={draft.phone_country_code || "+32"}
                        onChange={(event) => update("phone_country_code", event.target.value)}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none"
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
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                      />
                    </div>
                  </label>
                  <IndustrySelect
                    value={draft.industry}
                    onChange={(val) => update("industry", val)}
                  />
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-zinc-600">Aanbevolen actie / Contact description</span>
                    <textarea
                      value={draft.suggested_action}
                      onChange={(event) => update("suggested_action", event.target.value)}
                      className="min-h-24 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                    />
                  </label>
                </div>
              )}

              <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                <p className="font-medium text-zinc-900">Context voor Salesforce review</p>
                <p className="mt-1">Leadscore: {draft.lead_rating}</p>
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
                  className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white"
                >
                  Volgende
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSave(draft)}
                  disabled={isSaving || draft.status === "saved"}
                  className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {draft.status === "saved"
                    ? "Opgeslagen"
                    : isSaving
                      ? "Bezig met opslaan..."
                      : usesExistingAccount
                        ? "Opslaan als contact"
                        : "Opslaan"}
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
