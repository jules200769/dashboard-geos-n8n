import { supabaseServerClient } from "../supabase";
import type { LeadRecord, MetricsResponse, Industry } from "../types";

const TABLE = "lead_queue";

function envFlag(name: string): boolean {
  const raw = process.env[name];
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  return !["0", "false", "no", "off", ""].includes(normalized);
}

function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
}

let mockLeadsStore: LeadRecord[] | null = null;
function getMockStore(): LeadRecord[] {
  if (mockLeadsStore) return mockLeadsStore;

  const base: Omit<LeadRecord, "id" | "subject" | "email_body" | "contact_name" | "org_name" | "sender_email" | "sender_domain" | "sentiment" | "primary_topic" | "intent" | "urgency_score" | "lead_rating" | "status" | "created_at" | "updated_at" | "saved_at" | "industry"> =
    {
      source_message_id: null,
      phone_country_code: "+31",
      phone_number: "612345678",
      sentiment_confidence: "0.78",
      secondary_topics: "pricing, availability",
      budget_mentioned: true,
      event_referenced: "",
      suggested_action: "Reply with availability and request a short intro call.",
      exists_in_salesforce: false,
      matched_in: [],
      match_reason: "",
      salesforce_mode: "create_account_then_contact",
      matched_account_id: "",
      matched_account_name: "",
      matched_account_website: "",
      account_name: "",
      account_number: "",
      account_description: "",
      save_payload: {},
      raw_payload: {},
    };

  mockLeadsStore = [
    {
      ...base,
      id: "mock-1",
      contact_name: "Sanne de Vries",
      org_name: "NorthSea Logistics",
      sender_email: "sanne@northsea-logistics.nl",
      sender_domain: "northsea-logistics.nl",
      subject: "Vraag: live GEOs dashboard voor ons team",
      sentiment: "Positive",
      primary_topic: "dashboard",
      intent: "Request demo",
      urgency_score: 7,
      lead_rating: "Hot",
      industry: "concrete",
      status: "open",
      email_body:
        "Hoi! Kunnen we een demo plannen? We zoeken een live dashboard met GEOs voor ons sales team. Wat is de lead time en prijsindicatie?",
      created_at: isoDaysAgo(0),
      updated_at: isoDaysAgo(0),
      saved_at: null,
    },
    {
      ...base,
      id: "mock-2",
      contact_name: "Luca Bianchi",
      org_name: "Helios Energy",
      sender_email: "luca@helios-energy.eu",
      sender_domain: "helios-energy.eu",
      subject: "Pricing + integration question",
      sentiment: "Neutral",
      primary_topic: "integration",
      intent: "Ask pricing",
      urgency_score: 4,
      lead_rating: "Warm",
      industry: "cement",
      status: "saved",
      email_body:
        "Hi team — can you share pricing tiers and whether this integrates with our existing reporting pipeline? A quick overview would help.",
      created_at: isoDaysAgo(2),
      updated_at: isoDaysAgo(1),
      saved_at: isoDaysAgo(0),
    },
    {
      ...base,
      id: "mock-3",
      contact_name: "M. Johnson",
      org_name: "Acme Retail",
      sender_email: "mj@acme-retail.com",
      sender_domain: "acme-retail.com",
      subject: "Not sure this fits",
      sentiment: "Negative",
      primary_topic: "scope",
      intent: "Evaluate",
      urgency_score: 2,
      lead_rating: "Cold",
      industry: "diverse",
      status: "open",
      email_body:
        "We’re evaluating alternatives. Not convinced this will cover our use case — do you support custom segments and exports?",
      created_at: isoDaysAgo(6),
      updated_at: isoDaysAgo(6),
      saved_at: null,
    },
  ];

  return mockLeadsStore;
}

export async function getLeads(): Promise<LeadRecord[]> {
  if (envFlag("MOCK_LEADS")) {
    return getMockStore().slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const supabase = supabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LeadRecord[];
}

export async function getLeadById(id: string): Promise<LeadRecord | null> {
  if (envFlag("MOCK_LEADS")) {
    return getMockStore().find((l) => l.id === id) ?? null;
  }
  const supabase = supabaseServerClient();
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as LeadRecord | null) ?? null;
}

export async function upsertLead(lead: Partial<LeadRecord>): Promise<LeadRecord> {
  if (envFlag("MOCK_LEADS")) {
    const store = getMockStore();
    const now = new Date().toISOString();
    const id = lead.id ?? lead.source_message_id ?? `mock-${Math.random().toString(16).slice(2)}`;

    const existingIdx = store.findIndex((l) => l.id === id);
    const existing = existingIdx >= 0 ? store[existingIdx] : null;

    const fallback: LeadRecord =
      existing ??
      ({
        id,
        source_message_id: lead.source_message_id ?? null,
        contact_name: lead.contact_name ?? "Unknown",
        org_name: lead.org_name ?? "Unknown",
        sender_email: lead.sender_email ?? "unknown@example.com",
        sender_domain: lead.sender_domain ?? "example.com",
        subject: lead.subject ?? "(no subject)",
        sentiment: lead.sentiment ?? "Neutral",
        sentiment_confidence: lead.sentiment_confidence ?? "0.5",
        primary_topic: lead.primary_topic ?? "",
        secondary_topics: lead.secondary_topics ?? "",
        intent: lead.intent ?? "",
        urgency_score: lead.urgency_score ?? 0,
        budget_mentioned: lead.budget_mentioned ?? false,
        event_referenced: lead.event_referenced ?? "",
        suggested_action: lead.suggested_action ?? "",
        industry: (lead.industry ?? "diverse") as Industry,
        email_body: lead.email_body ?? "",
        exists_in_salesforce: lead.exists_in_salesforce ?? false,
        matched_in: lead.matched_in ?? [],
        match_reason: lead.match_reason ?? "",
        salesforce_mode: lead.salesforce_mode ?? "create_account_then_contact",
        matched_account_id: lead.matched_account_id ?? "",
        matched_account_name: lead.matched_account_name ?? "",
        matched_account_website: lead.matched_account_website ?? "",
        account_name: lead.account_name ?? lead.org_name ?? "",
        account_number: lead.account_number ?? "",
        account_description: lead.account_description ?? "",
        lead_rating: lead.lead_rating ?? "Warm",
        status: lead.status ?? "open",
        save_payload: lead.save_payload ?? {},
        raw_payload: lead.raw_payload ?? {},
        created_at: lead.created_at ?? now,
        updated_at: lead.updated_at ?? now,
        saved_at: lead.saved_at ?? null,
      } as LeadRecord);

    const merged: LeadRecord = {
      ...fallback,
      ...(lead as Partial<LeadRecord>),
      id,
      updated_at: now,
    };

    if (existingIdx >= 0) store[existingIdx] = merged;
    else store.unshift(merged);
    return merged;
  }
  const supabase = supabaseServerClient();
  const conflictTarget = lead.source_message_id ? "source_message_id" : "id";
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(lead, { onConflict: conflictTarget })
    .select("*")
    .single();
  if (error) throw error;
  return data as LeadRecord;
}

export async function deleteLead(id: string): Promise<void> {
  if (envFlag("MOCK_LEADS")) {
    const store = getMockStore();
    mockLeadsStore = store.filter((l) => l.id !== id);
    return;
  }
  const supabase = supabaseServerClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function markLeadSaved(
  id: string,
  savePayload: Record<string, unknown>,
): Promise<LeadRecord> {
  if (envFlag("MOCK_LEADS")) {
    const store = getMockStore();
    const idx = store.findIndex((l) => l.id === id);
    if (idx < 0) throw new Error("Lead not found");
    const now = new Date().toISOString();
    const updated: LeadRecord = {
      ...store[idx],
      status: "saved",
      saved_at: now,
      save_payload: savePayload,
      updated_at: now,
    };
    store[idx] = updated;
    return updated;
  }
  const supabase = supabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: "saved",
      saved_at: new Date().toISOString(),
      save_payload: savePayload,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as LeadRecord;
}

export async function markLeadRechecked(
  id: string,
  result: {
    existsInSalesforce: boolean;
    matchedIn: string[];
    reason: string;
    salesforceMode?: LeadRecord["salesforce_mode"];
    matchedAccountId?: string;
    matchedAccountName?: string;
    matchedAccountWebsite?: string;
    accountName?: string;
    accountNumber?: string;
    accountDescription?: string;
    rawPayload: Record<string, unknown>;
  },
): Promise<LeadRecord> {
  if (envFlag("MOCK_LEADS")) {
    const store = getMockStore();
    const idx = store.findIndex((l) => l.id === id);
    if (idx < 0) throw new Error("Lead not found");
    const now = new Date().toISOString();
    const updated: LeadRecord = {
      ...store[idx],
      exists_in_salesforce: result.existsInSalesforce,
      matched_in: result.matchedIn,
      match_reason: result.reason,
      salesforce_mode: result.salesforceMode ?? store[idx].salesforce_mode,
      matched_account_id: result.matchedAccountId ?? store[idx].matched_account_id,
      matched_account_name: result.matchedAccountName ?? store[idx].matched_account_name,
      matched_account_website: result.matchedAccountWebsite ?? store[idx].matched_account_website,
      account_name: result.accountName ?? store[idx].account_name,
      account_number: result.accountNumber ?? store[idx].account_number,
      account_description: result.accountDescription ?? store[idx].account_description,
      raw_payload: result.rawPayload,
      updated_at: now,
    };
    store[idx] = updated;
    return updated;
  }

  const supabase = supabaseServerClient();
  const updatePayload: Partial<LeadRecord> = {
    exists_in_salesforce: result.existsInSalesforce,
    matched_in: result.matchedIn,
    match_reason: result.reason,
    raw_payload: result.rawPayload,
  };
  if (result.salesforceMode) updatePayload.salesforce_mode = result.salesforceMode;
  if (result.matchedAccountId !== undefined) updatePayload.matched_account_id = result.matchedAccountId;
  if (result.matchedAccountName !== undefined) updatePayload.matched_account_name = result.matchedAccountName;
  if (result.matchedAccountWebsite !== undefined) updatePayload.matched_account_website = result.matchedAccountWebsite;
  if (result.accountName !== undefined) updatePayload.account_name = result.accountName;
  if (result.accountNumber !== undefined) updatePayload.account_number = result.accountNumber;
  if (result.accountDescription !== undefined) updatePayload.account_description = result.accountDescription;

  const { data, error } = await supabase
    .from(TABLE)
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as LeadRecord;
}

function startOfTodayIso(): string {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return start.toISOString();
}

function toDayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function calculateMetrics(leads: LeadRecord[]): MetricsResponse {
  const openLeads = leads.filter((lead) => lead.status === "open").length;
  const todayIso = startOfTodayIso();
  const savedToday = leads.filter((lead) => lead.status === "saved" && (lead.saved_at ?? "") >= todayIso).length;

  // Baseline assumption chosen in planning: 8 minutes manual vs 2 minutes assisted.
  const estimatedTimeSavedMinutes = savedToday * 6;

  const byDay = new Map<string, { open: number; saved: number }>();
  for (const lead of leads) {
    const day = toDayKey(lead.created_at);
    const bucket = byDay.get(day) ?? { open: 0, saved: 0 };
    if (lead.status === "saved") bucket.saved += 1;
    else bucket.open += 1;
    byDay.set(day, bucket);
  }

  const openVsSavedSeries = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([day, counts]) => ({ day, ...counts }));

  const sentimentMap = new Map<string, number>();
  const topicMap = new Map<string, number>();
  const intentMap = new Map<string, number>();

  for (const lead of leads) {
    sentimentMap.set(lead.sentiment, (sentimentMap.get(lead.sentiment) ?? 0) + 1);
    if (lead.primary_topic) {
      topicMap.set(lead.primary_topic, (topicMap.get(lead.primary_topic) ?? 0) + 1);
    }
    if (lead.intent) {
      intentMap.set(lead.intent, (intentMap.get(lead.intent) ?? 0) + 1);
    }
  }

  const sentimentMix = Array.from(sentimentMap.entries()).map(([name, value]) => ({ name, value }));
  const topicSeries = Array.from(topicMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([topic, count]) => ({ topic, count }));
  const intentSeries = Array.from(intentMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([intent, count]) => ({ intent, count }));

  return {
    openLeads,
    savedToday,
    estimatedTimeSavedMinutes,
    openVsSavedSeries,
    sentimentMix,
    topicSeries,
    intentSeries,
  };
}
