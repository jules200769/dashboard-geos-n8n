import type { LeadRecord, MetricsResponse } from "./types";

interface LeadsApiResponse {
  leads: LeadRecord[];
  metrics: MetricsResponse;
}

export async function fetchLeads(): Promise<LeadsApiResponse> {
  const response = await fetch("/api/leads", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load leads");
  return response.json();
}

export async function saveLead(id: string): Promise<{ message: string }> {
  const response = await fetch(`/api/leads/${id}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Save failed");
  }
  return payload;
}
