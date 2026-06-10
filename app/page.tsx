"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LeadCard } from "@/components/LeadCard";
import { LeadDetailDrawer } from "@/components/LeadDetailDrawer";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardPageSkeleton } from "@/components/DashboardSkeleton";
import { FeedbackToast } from "@/components/FeedbackToast";
import { fetchLeads, ignoreLead, recheckLead, saveLead } from "@/lib/api";
import { useCountUp } from "@/lib/useCountUp";
import type { LeadRecord, MetricsResponse } from "@/lib/types";

const emptyMetrics: MetricsResponse = {
  openLeads: 0,
  savedToday: 0,
  estimatedTimeSavedMinutes: 0,
  openVsSavedSeries: [],
  sentimentMix: [],
  topicSeries: [],
  intentSeries: [],
};

function KpiTile({
  title,
  value,
  titleLogo,
}: {
  title: string;
  value: string | number;
  titleLogo?: "salesforce" | "gmail";
}) {
  const logo =
    titleLogo === "salesforce"
      ? { src: "/salesforce-logo.png" as const, alt: "Salesforce" }
      : titleLogo === "gmail"
        ? { src: "/gmail-logo.png" as const, alt: "Gmail" }
        : null;

  const numericValue = typeof value === "number" ? value : 0;
  const counted = useCountUp(numericValue);
  const displayValue = typeof value === "number" ? counted : value;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <p
        className={`text-base text-zinc-500 ${logo ? "flex flex-wrap items-center gap-2" : ""}`}
      >
        {logo ? (
          <>
            <span>{title}</span>
            <Image
              src={logo.src}
              alt={logo.alt}
              width={80}
              height={26}
              className="h-5 w-auto max-w-[6.5rem] object-contain"
            />
          </>
        ) : (
          title
        )}
      </p>
      <p className="mt-2 text-4xl font-semibold text-zinc-900 tabular-nums">{displayValue}</p>
    </div>
  );
}

export default function Home() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse>(emptyMetrics);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [ignoringId, setIgnoringId] = useState<string | null>(null);
  const [recheckingId, setRecheckingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [notFoundModalLead, setNotFoundModalLead] = useState<LeadRecord | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetchLeads();
      setLeads(response.leads);
      setMetrics(response.metrics ?? emptyMetrics);
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : "Kon dashboard niet laden.", type: "error" });
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    setHasMounted(true);
    loadDashboard();
  }, []);

  const openLeads = useMemo(() => leads.filter((lead) => lead.status === "open"), [leads]);

  const handleLeadChange = (next: LeadRecord) => {
    setLeads((current) => current.map((lead) => (lead.id === next.id ? next : lead)));
    setSelectedLead(next);
  };

  const handleIgnore = async (lead: LeadRecord) => {
    setIgnoringId(lead.id);
    setFeedback(null);
    try {
      await ignoreLead(lead.id);
      setLeads((current) => current.filter((item) => item.id !== lead.id));
      if (selectedLead?.id === lead.id) setSelectedLead(null);
      setFeedback({ text: "Lead verwijderd.", type: "info" });
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : "Verwijderen mislukt.", type: "error" });
    } finally {
      setIgnoringId(null);
    }
  };

  const handleSave = async (lead: LeadRecord) => {
    setSavingId(lead.id);
    setFeedback(null);
    try {
      const result = await saveLead(lead.id, lead);
      setLeads((current) =>
        current.map((item) =>
          item.id === lead.id
            ? result.lead
            : item,
        ),
      );
      setSelectedLead((current) =>
        current && current.id === lead.id
          ? result.lead
          : current,
      );
      setFeedback({ text: result.message, type: "success" });
      await loadDashboard();
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : "Opslaan mislukt.", type: "error" });
    } finally {
      setSavingId(null);
    }
  };

  const handleRecheck = async (lead: LeadRecord) => {
    setRecheckingId(lead.id);
    setFeedback(null);
    try {
      const result = await recheckLead(lead.id);
      setLeads((current) => current.map((item) => (item.id === lead.id ? result.lead : item)));
      setSelectedLead((current) => (current && current.id === lead.id ? result.lead : current));
      
      const name = lead.contact_name || lead.sender_email || "Lead";
      const isInSf = result.lead.exists_in_salesforce;
      
      if (isInSf) {
        setFeedback({
          text: `${name} staat wel in Salesforce.`,
          type: "error"
        });
      } else {
        setNotFoundModalLead(result.lead);
      }
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : "Salesforce-controle mislukt.", type: "error" });
    } finally {
      setRecheckingId(null);
    }
  };

  if (isLoading && !hasLoadedOnce) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-100 text-zinc-900 xl:min-h-0 xl:flex-1 xl:overflow-hidden">
      <main className="mx-auto flex w-full max-w-[1600px] flex-col px-6 py-4 pb-8 md:px-12 md:py-5 xl:flex-1 xl:min-h-0 xl:overflow-hidden xl:pb-5">
        <DashboardHeader
          title="Salesforce-dashboard"
          subtitle="Inbox van leads die niet in Salesforce gevonden zijn."
          navLink={{
            href: "/geschiedenis",
            label: "Geschiedenis",
            variant: "primary",
            icon: (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 3v5h5" />
                <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
                <path d="M12 7v5l4 2" />
              </svg>
            ),
          }}
          onRefresh={loadDashboard}
          isRefreshing={isLoading}
        />

        <AnimatePresence>
          {feedback && <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />}
        </AnimatePresence>

        <section className="mb-4 grid shrink-0 grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          <KpiTile title="Open leads" value={metrics.openLeads} titleLogo="gmail" />
          <KpiTile title="Vandaag opgeslagen" value={metrics.savedToday} titleLogo="salesforce" />
          <KpiTile title="Geschatte tijdsbesparing (min)" value={metrics.estimatedTimeSavedMinutes} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-2 xl:grid-rows-1 xl:gap-6 xl:overflow-hidden">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6 xl:flex xl:min-h-0 xl:flex-col">
            <h2 className="mb-3 text-base font-semibold text-zinc-800 xl:shrink-0">Open vs opgeslagen (laatste 14 dagen)</h2>
            <div className="h-72 w-full shrink-0 xl:h-auto xl:min-h-0 xl:flex-1">
              {hasMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.openVsSavedSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 13 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="open" name="Open" stroke="#0f172a" strokeWidth={2} />
                    <Line type="monotone" dataKey="saved" name="Opgeslagen" stroke="#16a34a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6 xl:min-h-0">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
              <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-zinc-800">
                <span>Potentiële Salesforce contacten</span>
                <Image
                  src="/salesforce-logo.png"
                  alt="Salesforce"
                  width={80}
                  height={26}
                  className="h-5 w-auto max-w-[6.5rem] object-contain"
                />
              </h2>
              <p className="shrink-0 text-sm text-zinc-500">{openLeads.length} vermeldingen</p>
            </div>
            <div className="flex h-80 min-h-0 flex-col gap-3 overflow-y-auto pr-2 xl:h-auto xl:flex-1">
              {openLeads.length === 0 ? (
                <div className="py-8 text-center text-base text-zinc-500">Geen open leads in de wachtrij.</div>
              ) : (
                <AnimatePresence initial mode="popLayout">
                  {openLeads.map((lead, index) => (
                    <motion.div
                      key={lead.id}
                      layout
                      initial={{ opacity: 0, y: 14 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: Math.min(index * 0.04, 0.4), duration: 0.3, ease: "easeOut" },
                      }}
                      exit={{ opacity: 0, x: 48, scale: 0.97, transition: { duration: 0.25, ease: "easeIn" } }}
                    >
                      <LeadCard
                        lead={lead}
                        onOpen={setSelectedLead}
                        onIgnore={handleIgnore}
                        onRecheck={handleRecheck}
                        isSaving={savingId === lead.id}
                        isIgnoring={ignoringId === lead.id}
                        isRechecking={recheckingId === lead.id}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </section>


      </main>

      {notFoundModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-zinc-100 p-6 shadow-2xl">
            <button 
              onClick={() => setNotFoundModalLead(null)}
              className="absolute left-4 top-4 rounded-full p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="mb-6 mt-4 flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-zinc-900">
                {notFoundModalLead.contact_name || notFoundModalLead.sender_email || "Lead"} staat niet in Salesforce
              </h2>
            </div>

            <div className="mb-6">
              <LeadCard lead={notFoundModalLead} onOpen={() => {}} onIgnore={() => {}} onRecheck={() => {}} isSaving={false} isIgnoring={false} isRechecking={false} hideActions={true} />
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setSelectedLead(notFoundModalLead);
                  setNotFoundModalLead(null);
                }}
                className="rounded-lg bg-zinc-900 px-8 py-3 text-base font-medium text-white hover:bg-zinc-800"
              >
                Bekijk
              </button>
            </div>
          </div>
        </div>
      )}

      <LeadDetailDrawer
        lead={selectedLead}
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        onChange={handleLeadChange}
        onSave={handleSave}
        isSaving={savingId === selectedLead?.id}
      />
    </div>
  );
}
