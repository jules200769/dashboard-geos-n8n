"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LeadCard } from "@/components/LeadCard";
import { LeadDetailDrawer } from "@/components/LeadDetailDrawer";
import { fetchLeads, saveLead } from "@/lib/api";
import type { LeadRecord, MetricsResponse } from "@/lib/types";

const sentimentColors: Record<string, string> = {
  Positive: "#22c55e",
  Neutral: "#f59e0b",
  Negative: "#ef4444",
  Unknown: "#94a3b8",
};

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
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

export default function Home() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse>(emptyMetrics);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [hasMounted, setHasMounted] = useState(false);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetchLeads();
      setLeads(response.leads);
      setMetrics(response.metrics ?? emptyMetrics);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Kon dashboard niet laden.");
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

  const handleSave = async (lead: LeadRecord) => {
    setSavingId(lead.id);
    setFeedback("");
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
      setFeedback(result.message);
      await loadDashboard();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Save mislukt.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Geos Lead Review Dashboard</h1>
            <p className="text-sm text-zinc-600">
              Queue van leads die niet in Salesforce gevonden zijn.
            </p>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Refresh
          </button>
        </header>

        {feedback && (
          <div className="mb-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
            {feedback}
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <KpiTile title="Open leads" value={metrics.openLeads} />
          <KpiTile title="Saved vandaag" value={metrics.savedToday} />
          <KpiTile title="Geschatte tijdsbesparing (min)" value={metrics.estimatedTimeSavedMinutes} />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-zinc-800">Open vs Saved (laatste 14 dagen)</h2>
            <div className="h-64">
              {hasMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.openVsSavedSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="open" stroke="#0f172a" strokeWidth={2} />
                    <Line type="monotone" dataKey="saved" stroke="#16a34a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-zinc-800">Sentiment mix</h2>
            <div className="h-64">
              {hasMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.sentimentMix}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={92}
                      paddingAngle={3}
                    >
                      {metrics.sentimentMix.map((entry) => (
                        <Cell key={entry.name} fill={sentimentColors[entry.name] ?? "#64748b"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-zinc-800">Top topics</h2>
            <div className="h-64">
              {hasMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.topicSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-zinc-800">Top intents</h2>
            <div className="h-64">
              {hasMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.intentSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="intent" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Open review queue</h2>
            <p className="text-sm text-zinc-500">{openLeads.length} records</p>
          </div>
          {isLoading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
              Laden...
            </div>
          ) : openLeads.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
              Geen open leads in de queue.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {openLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onOpen={setSelectedLead}
                  onSave={handleSave}
                  isSaving={savingId === lead.id}
                />
              ))}
            </div>
          )}
        </section>
      </main>

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
