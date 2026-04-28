import type { LeadRecord, Industry, SalesforceMode } from "../types";
import { INDUSTRY_OPTIONS } from "../types";

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

function asRecord(value: unknown): AnyJson {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as AnyJson) : {};
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

function toIndustry(value: unknown): Industry {
  const raw = asString(value, "diverse").trim().toLowerCase();
  const match = INDUSTRY_OPTIONS.find((opt) => opt.toLowerCase() === raw);
  return match ?? "diverse";
}

function inferLeadRating(sentiment: string, urgency: number): "Hot" | "Warm" | "Cold" {
  if (sentiment === "Positive" && urgency >= 7) return "Hot";
  if (sentiment === "Negative") return "Cold";
  return "Warm";
}

function inferSalesforceMode(payload: AnyJson, matchedIn: string[]): SalesforceMode {
  const explicit = asString(payload.salesforce_mode);
  if (
    explicit === "create_contact_under_existing_account" ||
    explicit === "create_account_then_contact"
  ) {
    return explicit;
  }

  const accountFound =
    asBoolean(payload.accountFound) ||
    matchedIn.some((match) => match.toLowerCase() === "account") ||
    Boolean(asString(payload.matchedAccountId || payload.matched_account_id));

  return accountFound ? "create_contact_under_existing_account" : "create_account_then_contact";
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
  const matchedIn = toMatchedIn(payload.matchedIn || payload.matched_in);
  const prefillAccount = asRecord(payload.prefillAccount);
  const salesforceMode = inferSalesforceMode(payload, matchedIn);
  const accountName = asString(
    prefillAccount.name ||
      payload.account_name ||
      payload.matchedAccountName ||
      payload.matched_account_name ||
      payload.org_name ||
      payload.company,
  );

  return {
    source_message_id: asString(payload.message_id || payload.id) || null,
    contact_name: asString(payload.contact_name),
    org_name: asString(payload.org_name || payload.company),
    sender_email: senderEmail,
    sender_domain: senderDomain,
    phone_country_code: asString(payload.phone_country_code),
    phone_number: asString(payload.phone_number),
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
    email_body: asString(payload.emailBody || payload.email_body || payload.text),
    industry: toIndustry(payload.industry),
    exists_in_salesforce: asBoolean(payload.existsInSalesforce),
    matched_in: matchedIn,
    match_reason: asString(payload.reason),
    salesforce_mode: salesforceMode,
    matched_account_id: asString(payload.matchedAccountId || payload.matched_account_id),
    matched_account_name: asString(payload.matchedAccountName || payload.matched_account_name),
    matched_account_website: asString(payload.matchedAccountWebsite || payload.matched_account_website),
    account_name: accountName,
    account_number: asString(prefillAccount.accountNumber || prefillAccount.account_number || payload.account_number),
    account_description: asString(
      prefillAccount.description ||
        payload.account_description ||
        payload.suggested_action ||
        payload.reason,
    ),
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
    industry: lead.industry,
    lead_rating: lead.lead_rating,
    matched_in: lead.matched_in,
    match_reason: lead.match_reason,
    salesforce_mode: lead.salesforce_mode,
    matched_account_id: lead.matched_account_id,
    matched_account_name: lead.matched_account_name,
    matched_account_website: lead.matched_account_website,
    account_name: lead.account_name,
    account_number: lead.account_number,
    account_description: lead.account_description,
    contact: {
      full_name: lead.contact_name,
      email: lead.sender_email,
      phone_country_code: lead.phone_country_code,
      phone_number: lead.phone_number,
      description: lead.suggested_action,
    },
    account: {
      id: lead.matched_account_id,
      name: lead.account_name || lead.matched_account_name || lead.org_name,
      number: lead.account_number,
      description: lead.account_description,
      website: lead.matched_account_website || (lead.sender_domain ? `https://${lead.sender_domain}` : ""),
    },
    saved_at: new Date().toISOString(),
  };
}
