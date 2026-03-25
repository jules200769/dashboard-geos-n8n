import type { LeadRecord } from "../types";

type AnyJson = Record<string, unknown>;

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toMatchedIn(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => asString(item)).filter(Boolean);
  const single = asString(value);
  return single ? [single] : [];
}

function normalizeEmail(value: unknown): string {
  const raw = asString(value).trim();
  const bracketMatch = raw.match(/<([^>]+)>/);
  if (bracketMatch?.[1]) return bracketMatch[1].trim().toLowerCase();
  return raw.toLowerCase();
}

function inferDomain(email: string, fallback: string): string {
  if (fallback) return fallback.toLowerCase();
  const parts = email.split("@");
  return parts[1]?.trim().toLowerCase() ?? "";
}

function inferLeadRating(sentiment: string, urgency: number): "Hot" | "Warm" | "Cold" {
  if (sentiment === "Positive" && urgency >= 7) return "Hot";
  if (sentiment === "Negative") return "Cold";
  return "Warm";
}

export interface LeadInsertPayload extends Omit<LeadRecord, "id" | "created_at" | "updated_at" | "saved_at" | "save_payload"> {
  save_payload?: Record<string, unknown>;
}

export function shouldIngestLead(payload: AnyJson): boolean {
  const existsInSalesforce = asBoolean(payload.existsInSalesforce);
  return existsInSalesforce === false;
}

export function mapIncomingPayload(payload: AnyJson): LeadInsertPayload {
  const senderEmail = normalizeEmail(payload.sender_email);
  const senderDomain = inferDomain(senderEmail, asString(payload.sender_domain));
  const sentiment = asString(payload.sentiment, "Unknown");
  const urgency = Math.max(0, Math.min(10, asNumber(payload.urgency_score, 0)));

  return {
    source_message_id: asString(payload.message_id || payload.id) || null,
    contact_name: asString(payload.contact_name),
    org_name: asString(payload.org_name || payload.company),
    sender_email: senderEmail,
    sender_domain: senderDomain,
    subject: asString(payload.subject),
    sentiment,
    sentiment_confidence: asString(payload.confidence || payload.sentimentConfidence, "N/A"),
    primary_topic: asString(payload.primary_topic),
    secondary_topics: asString(payload.secondary_topics),
    intent: asString(payload.intent),
    urgency_score: urgency,
    budget_mentioned: asBoolean(payload.budget_mentioned),
    event_referenced: asString(payload.event_referenced),
    suggested_action: asString(payload.suggested_action),
    exists_in_salesforce: asBoolean(payload.existsInSalesforce),
    matched_in: toMatchedIn(payload.matchedIn),
    match_reason: asString(payload.reason),
    lead_rating: inferLeadRating(sentiment, urgency),
    status: "open",
    raw_payload: payload,
  };
}

export function mapLeadForSave(lead: LeadRecord): Record<string, unknown> {
  return {
    id: lead.id,
    contact_name: lead.contact_name,
    org_name: lead.org_name,
    sender_email: lead.sender_email,
    sender_domain: lead.sender_domain,
    subject: lead.subject,
    sentiment: lead.sentiment,
    urgency_score: lead.urgency_score,
    primary_topic: lead.primary_topic,
    intent: lead.intent,
    suggested_action: lead.suggested_action,
    lead_rating: lead.lead_rating,
    matched_in: lead.matched_in,
    match_reason: lead.match_reason,
    saved_at: new Date().toISOString(),
  };
}
