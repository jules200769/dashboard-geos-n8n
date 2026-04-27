import type { LeadRecord, MetricsResponse } from "./types";

interface LeadsApiResponse {
  leads: LeadRecord[];
  metrics: MetricsResponse;
}

/** Bekende Engelstalige API-fouten vertalen voor de UI (geen backend-wijziging). */
const API_ERROR_NL: Record<string, string> = {
  "Save failed": "Opslaan mislukt.",
  "Lead not found": "Lead niet gevonden.",
  "Failed to load leads": "Leads laden mislukt.",
  "Re-check failed": "Salesforce-controle mislukt.",
  "Re-check webhook not configured": "Salesforce-controle is nog niet geconfigureerd.",
};

function translateApiError(message: string): string {
  return API_ERROR_NL[message] ?? message;
}

export async function fetchLeads(): Promise<LeadsApiResponse> {
  const response = await fetch("/api/leads", { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as
    | LeadsApiResponse
    | { error?: string }
    | null;

  if (!response.ok) {
    const raw =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Leads laden mislukt.";
    throw new Error(translateApiError(raw));
  }

  return payload as LeadsApiResponse;
}

export async function ignoreLead(id: string): Promise<{ message: string }> {
  const response = await fetch(`/api/leads/${id}`, { method: "DELETE" });
  const payload = await response.json();
  if (!response.ok) {
    const raw = typeof payload.error === "string" ? payload.error : "Verwijderen mislukt.";
    throw new Error(raw);
  }
  return payload;
}

export async function saveLead(id: string, lead: LeadRecord): Promise<{ message: string; lead: LeadRecord }> {
  const response = await fetch(`/api/leads/${id}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lead }),
  });
  const payload = await response.json();
  if (!response.ok) {
    const raw = typeof payload.error === "string" ? payload.error : "Opslaan mislukt.";
    throw new Error(translateApiError(raw));
  }
  return payload;
}

export async function recheckLead(id: string): Promise<{ lead: LeadRecord; message: string }> {
  const response = await fetch(`/api/leads/${id}/recheck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const payload = await response.json();
  if (!response.ok) {
    const raw = typeof payload.error === "string" ? payload.error : "Salesforce-controle mislukt.";
    throw new Error(translateApiError(raw));
  }
  return payload;
}
