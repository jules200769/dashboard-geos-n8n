"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { LeadCard } from "@/components/LeadCard";
import { LeadDetailDrawer } from "@/components/LeadDetailDrawer";
import { fetchLeads, ignoreLead, recheckLead, saveLead } from "@/lib/api";
import type { LeadRecord, MetricsResponse } from "@/lib/types";

const COLORS = ['#7c3aed', '#0284c7', '#16a34a', '#ea580c', '#e11d48', '#d97706'];

const emptyMetrics: MetricsResponse = {
  openLeads: 0,
  savedToday: 0,
  estimatedTimeSavedMinutes: 0,
  openVsSavedSeries: [],
  sentimentMix: [],
  topicSeries: [],
  intentSeries: [],
};

function KpiTile({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-base text-zinc-500">{title}</p>
      <p className="mt-2 text-4xl font-semibold text-zinc-900">{value}</p>
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
      const result = await saveLead(lead.id);
      setLeads((current) =>
        current.map((item) =>
          item.id === lead.id
            ? { ...item, status: "saved", saved_at: new Date().toISOString() }
            : item,
        ),
      );
      setSelectedLead((current) =>
        current && current.id === lead.id
          ? { ...current, status: "saved", saved_at: new Date().toISOString() }
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

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <main className="mx-auto max-w-[1600px] px-6 py-8 md:px-12">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              aria-label="Ga naar dashboard home"
            >
              <Image
                src="/logo-geos.png"
                alt="GEOS Laboratories"
                width={160}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <div>
              <h1 className="text-3xl font-semibold text-zinc-900">leadreview-dashboard</h1>
              <p className="text-base text-zinc-600">
                Wachtrij van leads die niet in Salesforce gevonden zijn.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-base font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Vernieuwen
          </button>
        </header>

        {feedback && (
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
            <button onClick={() => setFeedback(null)} className="ml-2 shrink-0 text-zinc-400 hover:text-zinc-600" aria-label="Sluiten">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <KpiTile title="Open leads" value={metrics.openLeads} />
          <KpiTile title="Vandaag opgeslagen" value={metrics.savedToday} />
          <KpiTile title="Geschatte tijdsbesparing (min)" value={metrics.estimatedTimeSavedMinutes} />
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-zinc-800">Open vs opgeslagen (laatste 14 dagen)</h2>
            <div className="h-80">
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
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-800">Open beoordelingswachtrij</h2>
              <p className="text-sm text-zinc-500">{openLeads.length} vermeldingen</p>
            </div>
            <div className="h-80 overflow-y-auto pr-2 flex flex-col gap-3">
              {isLoading ? (
                <div className="py-8 text-center text-base text-zinc-500">Laden...</div>
              ) : openLeads.length === 0 ? (
                <div className="py-8 text-center text-base text-zinc-500">Geen open leads in de wachtrij.</div>
              ) : (
                openLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onOpen={setSelectedLead}
                    onSave={handleSave}
                    onIgnore={handleIgnore}
                    onRecheck={handleRecheck}
                    isSaving={savingId === lead.id}
                    isIgnoring={ignoringId === lead.id}
                    isRechecking={recheckingId === lead.id}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-zinc-800">Top onderwerpen</h2>
            <div className="h-80">
              {hasMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.topicSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" tick={{ fontSize: 13 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-zinc-800">Top intenties</h2>
            <div className="h-80">
              {hasMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.intentSeries}
                      dataKey="count"
                      nameKey="intent"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label={(props) =>
                        typeof props.name === "string" ? props.name.replace(/_/g, " ") : props.name
                      }
                    >
                      {metrics.intentSeries.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Aantal"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : null}
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
              <LeadCard lead={notFoundModalLead} onOpen={() => {}} onSave={() => {}} onIgnore={() => {}} onRecheck={() => {}} isSaving={false} isIgnoring={false} isRechecking={false} hideActions={true} />
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
