"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LeadCard } from "@/components/LeadCard";
import { LeadDetailDrawer } from "@/components/LeadDetailDrawer";
import { fetchLeads, ignoreLead, saveLead } from "@/lib/api";
import type { LeadRecord } from "@/lib/types";

type Feedback = { text: string; type: "success" | "error" | "info" };

function FeedbackToast({ feedback, onClose }: { feedback: Feedback; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border bg-white px-5 py-4 text-base shadow-xl transition-all duration-300">
      {feedback.type === "success" && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
      {feedback.type === "error" && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      )}
      {feedback.type === "info" && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
      )}
      <div className="font-medium text-zinc-800">{feedback.text}</div>
      <button onClick={onClose} className="ml-2 shrink-0 text-zinc-400 hover:text-zinc-600" aria-label="Sluiten">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default function HistoryPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [ignoringId, setIgnoringId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetchLeads();
      setLeads(response.leads);
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : "Kon geschiedenis niet laden.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const savedLeads = useMemo(() => {
    const term = query.trim().toLowerCase();
    return leads
      .filter((lead) => lead.status === "saved")
      .filter((lead) => {
        if (!term) return true;
        return [lead.contact_name, lead.org_name, lead.sender_email, lead.account_name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));
      })
      .sort((a, b) => (b.saved_at ?? b.updated_at).localeCompare(a.saved_at ?? a.updated_at));
  }, [leads, query]);

  const handleLeadChange = (next: LeadRecord) => {
    setLeads((current) => current.map((lead) => (lead.id === next.id ? next : lead)));
    setSelectedLead(next);
  };

  const handleSave = async (lead: LeadRecord) => {
    setSavingId(lead.id);
    setFeedback(null);
    try {
      const result = await saveLead(lead.id, lead);
      setLeads((current) => current.map((item) => (item.id === lead.id ? result.lead : item)));
      setSelectedLead(null);
      setFeedback({ text: result.message, type: "success" });
      await loadHistory();
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : "Bijwerken mislukt.", type: "error" });
    } finally {
      setSavingId(null);
    }
  };

  const handleIgnore = async (lead: LeadRecord) => {
    setIgnoringId(lead.id);
    setFeedback(null);
    try {
      await ignoreLead(lead.id);
      setLeads((current) => current.filter((item) => item.id !== lead.id));
      if (selectedLead?.id === lead.id) setSelectedLead(null);
      setFeedback({ text: "Kaart uit geschiedenis verwijderd.", type: "info" });
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : "Verwijderen mislukt.", type: "error" });
    } finally {
      setIgnoringId(null);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-100 text-zinc-900 xl:min-h-0 xl:flex-1 xl:overflow-hidden">
      <main className="mx-auto flex w-full max-w-[1600px] flex-col px-6 py-4 pb-8 md:px-12 md:py-5 xl:flex-1 xl:min-h-0 xl:overflow-hidden xl:pb-5">
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
              <h1 className="text-3xl font-semibold text-zinc-900">Geschiedenis</h1>
              <p className="text-base text-zinc-600">
                Opgeslagen kaarten — corrigeer een fout en werk Salesforce bij.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-base font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            <button
              type="button"
              onClick={loadHistory}
              className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-base font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Vernieuwen
            </button>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-base font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
            >
              Uitloggen
            </button>
          </div>
        </header>

        {feedback && <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />}

        <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Zoek op naam, bedrijf of e-mail"
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-[3px] focus:ring-sky-500/15"
              />
            </div>
            <p className="shrink-0 text-sm text-zinc-500">{savedLeads.length} opgeslagen</p>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-3 overflow-y-auto pr-1 lg:grid-cols-2 lg:gap-4">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-base text-zinc-500">Laden...</div>
            ) : savedLeads.length === 0 ? (
              <div className="col-span-full flex flex-col items-center gap-2 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
                <p className="text-base text-zinc-500">
                  {query ? "Geen resultaten voor deze zoekopdracht." : "Nog geen opgeslagen kaarten."}
                </p>
              </div>
            ) : (
              savedLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  variant="history"
                  onOpen={() => setSelectedLead(lead)}
                  onEdit={setSelectedLead}
                  onIgnore={handleIgnore}
                  onRecheck={() => {}}
                  isSaving={savingId === lead.id}
                  isIgnoring={ignoringId === lead.id}
                  isRechecking={false}
                />
              ))
            )}
          </div>
        </section>
      </main>

      <LeadDetailDrawer
        lead={selectedLead}
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        onChange={handleLeadChange}
        onSave={handleSave}
        isSaving={savingId === selectedLead?.id}
        mode="edit"
      />
    </div>
  );
}
