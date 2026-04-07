"use client";

import type { LeadRecord } from "@/lib/types";

interface LeadCardProps {
  lead: LeadRecord;
  onOpen: (lead: LeadRecord) => void;
  onSave: (lead: LeadRecord) => void;
  onIgnore: (lead: LeadRecord) => void;
  isSaving: boolean;
  isIgnoring: boolean;
}

export function LeadCard({ lead, onOpen, onSave, onIgnore, isSaving, isIgnoring }: LeadCardProps) {
  const urgencyTone =
    lead.urgency_score >= 7
      ? "bg-red-100 text-red-700"
      : lead.urgency_score >= 4
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">
            {lead.contact_name || "Onbekende contactpersoon"}
          </h3>
          <p className="text-sm text-zinc-600">{lead.org_name || "Onbekend bedrijf"}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${urgencyTone}`}>
          Urgentie {lead.urgency_score}
        </span>
      </div>

      <div className="space-y-1 text-sm text-zinc-700">
        <p>
          <span className="font-medium">E-mail:</span> {lead.sender_email || "-"}
        </p>
        <p>
          <span className="font-medium">Domein:</span> {lead.sender_domain || "-"}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          disabled={isIgnoring}
          onClick={() => onIgnore(lead)}
          className="rounded-lg border border-red-600 bg-[#EE7371] px-3 py-2 text-sm font-medium text-white hover:bg-[#e06664] disabled:cursor-not-allowed disabled:bg-[#f4b2b1]"
        >
          {isIgnoring ? "Verwijderen..." : "Negeer"}
        </button>
        <button
          type="button"
          onClick={() => onOpen(lead)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Bekijk
        </button>
        <button
          type="button"
          disabled={isSaving || lead.status === "saved"}
          onClick={() => onSave(lead)}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {lead.status === "saved" ? "Opgeslagen" : isSaving ? "Bezig met opslaan..." : "Opslaan"}
        </button>
      </div>
    </article>
  );
}
