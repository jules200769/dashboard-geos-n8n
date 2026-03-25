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

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/35">
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Lead Review</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700"
          >
            Sluiten
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Naam</span>
            <input
              value={draft.contact_name}
              onChange={(event) => update("contact_name", event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Bedrijf</span>
            <input
              value={draft.org_name}
              onChange={(event) => update("org_name", event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Email</span>
            <input
              value={draft.sender_email}
              onChange={(event) => update("sender_email", event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Domain</span>
            <input
              value={draft.sender_domain}
              onChange={(event) => update("sender_domain", event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-600">Suggested action</span>
            <textarea
              value={draft.suggested_action}
              onChange={(event) => update("suggested_action", event.target.value)}
              className="min-h-24 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          <p className="font-medium text-zinc-900">Salesforce review context</p>
          <p className="mt-1">Lead rating: {draft.lead_rating}</p>
          <p>Intent: {draft.intent || "-"}</p>
          <p>Primary topic: {draft.primary_topic || "-"}</p>
          <p>Matched in: {draft.matched_in.join(", ") || "Geen match"}</p>
          <p>Reden not-found: {draft.match_reason || "Niet gevonden in Salesforce"}</p>
        </div>

        <button
          type="button"
          onClick={() => onSave(draft)}
          disabled={isSaving || draft.status === "saved"}
          className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {draft.status === "saved" ? "Saved" : isSaving ? "Saving..." : "Save"}
        </button>
      </aside>
    </div>
  );
}
