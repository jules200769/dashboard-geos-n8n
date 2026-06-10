"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LeadCard } from "@/components/LeadCard";
import { LeadDetailDrawer } from "@/components/LeadDetailDrawer";
import { DashboardHeader } from "@/components/DashboardHeader";
import { HistoryPageSkeleton } from "@/components/DashboardSkeleton";
import { FeedbackToast, type Feedback } from "@/components/FeedbackToast";
import { fetchLeads, ignoreLead, saveLead } from "@/lib/api";
import type { LeadRecord } from "@/lib/types";

export default function HistoryPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [ignoringId, setIgnoringId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

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
      setHasLoadedOnce(true);
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

  if (isLoading && !hasLoadedOnce) {
    return <HistoryPageSkeleton />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-100 text-zinc-900 xl:min-h-0 xl:flex-1 xl:overflow-hidden">
      <main className="mx-auto flex w-full max-w-[1600px] flex-col px-6 py-4 pb-8 md:px-12 md:py-5 xl:flex-1 xl:min-h-0 xl:overflow-hidden xl:pb-5">
        <DashboardHeader
          title="Geschiedenis"
          subtitle="Opgeslagen kaarten — corrigeer een fout en werk Salesforce bij."
          navLink={{
            href: "/",
            label: "Dashboard",
            variant: "secondary",
            icon: (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
            ),
          }}
          onRefresh={loadHistory}
          isRefreshing={isLoading}
        />

        <AnimatePresence>
          {feedback && <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />}
        </AnimatePresence>

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
            {savedLeads.length === 0 ? (
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
              <AnimatePresence initial mode="popLayout">
                {savedLeads.map((lead, index) => (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: Math.min(index * 0.03, 0.3), duration: 0.3, ease: "easeOut" },
                    }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.22, ease: "easeIn" } }}
                  >
                    <LeadCard
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
                  </motion.div>
                ))}
              </AnimatePresence>
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
