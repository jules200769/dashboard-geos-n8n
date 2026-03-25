import { supabaseServerClient } from "../supabase";
import type { LeadRecord, MetricsResponse } from "../types";

const TABLE = "lead_queue";

export async function getLeads(): Promise<LeadRecord[]> {
  const supabase = supabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LeadRecord[];
}

export async function getLeadById(id: string): Promise<LeadRecord | null> {
  const supabase = supabaseServerClient();
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as LeadRecord | null) ?? null;
}

export async function upsertLead(lead: Partial<LeadRecord>): Promise<LeadRecord> {
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

export async function markLeadSaved(
  id: string,
  savePayload: Record<string, unknown>,
): Promise<LeadRecord> {
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
