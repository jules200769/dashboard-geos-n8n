"use client";

import { useEffect, useState } from "react";
import type { LeadRecord } from "@/lib/types";

interface LeadDetailDrawerProps {
  lead: LeadRecord | null;
  open: boolean;
  onClose: () => void;
  onChange: (next: LeadRecord) => void;
  onSave: (lead: LeadRecord) => void;
  isSaving: boolean;
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

  useEffect(() => {
    setDraft(lead);
  }, [lead]);

  if (!open || !draft) return null;

  const update = <K extends keyof LeadRecord>(key: K, value: LeadRecord[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    onChange(next);
  };

  const hasEmailBody = Boolean(draft.email_body?.trim());

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/35">
      <aside className="flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Leadreview</h2>
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
              <h3 className="text-sm font-semibold text-zinc-800">Gegevens</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-1 gap-4">
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
                <label className="space-y-1">
                  <span className="text-xs font-medium text-zinc-600">Domein</span>
                  <input
                    value={draft.sender_domain}
                    onChange={(event) => update("sender_domain", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-zinc-600">Aanbevolen actie</span>
                  <textarea
                    value={draft.suggested_action}
                    onChange={(event) => update("suggested_action", event.target.value)}
                    className="min-h-24 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                  />
                </label>
              </div>

              <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                <p className="font-medium text-zinc-900">Context voor Salesforce review</p>
                <p className="mt-1">Leadscore: {draft.lead_rating}</p>
                <p>Intentie: {draft.intent || "-"}</p>
                <p>Hoofdonderwerp: {draft.primary_topic || "-"}</p>
                <p>Match gevonden in: {draft.matched_in.join(", ") || "Geen overeenkomst"}</p>
                <p>Reden not-found: {draft.match_reason || "Niet gevonden in Salesforce"}</p>
              </div>

              <button
                type="button"
                onClick={() => onSave(draft)}
                disabled={isSaving || draft.status === "saved"}
                className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {draft.status === "saved" ? "Opgeslagen" : isSaving ? "Bezig met opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
