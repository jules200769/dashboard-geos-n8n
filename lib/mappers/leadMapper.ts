import type {
  LeadRecord,
  Industry,
  SalesforceMode,
  SalesforceAccountCandidate,
  ContactGender,
} from "../types";
import { CONTACT_GENDER_OPTIONS, INDUSTRY_OPTIONS } from "../types";

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

function toAccountCandidates(payload: AnyJson): SalesforceAccountCandidate[] {
  const raw =
    payload.matchedAccountCandidates ??
    payload.matched_account_candidates ??
    payload.accountCandidates ??
    payload.account_candidates ??
    payload.matchedAccounts ??
    payload.matched_accounts;
  if (!Array.isArray(raw)) return [];
  const out: SalesforceAccountCandidate[] = [];
  for (const item of raw) {
    const rec = asRecord(item);
    const id = asString(rec.id ?? rec.Id).trim();
    if (!id) continue;
    out.push({
      id,
      name: asString(rec.name ?? rec.Name).trim(),
      website: asString(rec.website ?? rec.Website).trim(),
    });
  }
  return out;
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

function toContactGender(value: unknown): ContactGender | "" {
  const raw = asString(value).trim().toLowerCase();
  return CONTACT_GENDER_OPTIONS.includes(raw as ContactGender) ? (raw as ContactGender) : "";
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

/** Normalize account candidate arrays from n8n webhooks (camelCase or snake_case keys). */
export function accountCandidatesFromPayload(payload: Record<string, unknown>): SalesforceAccountCandidate[] {
  return toAccountCandidates(payload as AnyJson);
}

export function mapIncomingPayload(payload: AnyJson): LeadInsertPayload {
  const senderEmail = normalizeEmail(payload.sender_email);
  const senderDomain = inferDomain(senderEmail, asString(payload.sender_domain));
  const sentiment = asString(payload.sentiment, "Unknown");
  const urgency = Math.max(0, Math.min(10, asNumber(payload.urgency_score, 0)));
  const matchedIn = toMatchedIn(payload.matchedIn || payload.matched_in);
  const matchedAccountCandidates = toAccountCandidates(payload);
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
    owner: asString(payload.owner || payload.user_id || payload.userId) || "default",
    contact_name: asString(payload.contact_name),
    contact_gender: toContactGender(payload.contact_gender ?? payload.contactGender ?? payload.gender),
    org_name: asString(payload.org_name || payload.company),
    sender_email: senderEmail,
    sender_domain: senderDomain,
    phone_country_code: asString(payload.phone_country_code),
    phone_number: asString(payload.phone_number),
    contact_title: asString(payload.contact_title || payload.contactTitle),
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
    matched_account_candidates: matchedAccountCandidates,
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
    salesforce_account_id: "",
    salesforce_contact_id: "",
    raw_payload: payload,
  };
}

export type SaveMode = "create" | "update";
export type UpdateScope = "account" | "contact";

function pickStringField(source: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

/** Parse Salesforce IDs from an n8n webhook JSON body (string or object). */
export function parseSalesforceIdsFromWebhookBody(body?: string): { accountId: string; contactId: string } {
  if (!body?.trim()) return { accountId: "", contactId: "" };
  try {
    const parsed = JSON.parse(body);
    const record = (Array.isArray(parsed) ? parsed[0] : parsed) as Record<string, unknown> | null;
    if (!record || typeof record !== "object") return { accountId: "", contactId: "" };
    return {
      accountId: pickStringField(record, "salesforce_account_id", "accountId", "account_id"),
      contactId: pickStringField(record, "salesforce_contact_id", "contactId", "contact_id"),
    };
  } catch {
    return { accountId: "", contactId: "" };
  }
}

/**
 * Resolve Salesforce Account/Contact IDs for update flows.
 * Falls back to IDs stored in save_payload when DB columns are empty (older saved cards).
 */
export function resolveSalesforceIds(lead: LeadRecord): { accountId: string; contactId: string } {
  let accountId = String(lead.salesforce_account_id ?? "").trim();
  let contactId = String(lead.salesforce_contact_id ?? "").trim();

  const payload = lead.save_payload;
  if ((!contactId || !accountId) && payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    accountId = accountId || pickStringField(record, "salesforce_account_id", "accountId");
    contactId = contactId || pickStringField(record, "salesforce_contact_id", "contactId");

    const webhookStatus = record.webhookStatus;
    if (webhookStatus && typeof webhookStatus === "object") {
      const body = (webhookStatus as Record<string, unknown>).body;
      if (typeof body === "string") {
        const fromWebhook = parseSalesforceIdsFromWebhookBody(body);
        accountId = accountId || fromWebhook.accountId;
        contactId = contactId || fromWebhook.contactId;
      }
    }

    const account = record.account;
    if (account && typeof account === "object") {
      accountId = accountId || pickStringField(account as Record<string, unknown>, "salesforce_id", "id");
    }
    const contact = record.contact;
    if (contact && typeof contact === "object") {
      contactId = contactId || pickStringField(contact as Record<string, unknown>, "salesforce_id", "id");
    }
  }

  if (!accountId) {
    accountId = String(lead.matched_account_id ?? "").trim();
  }

  return { accountId, contactId };
}

/**
 * Build the payload sent to the n8n save/update webhook.
 *
 * `saveMode` tells n8n whether to create new Salesforce records or update the
 * existing ones referenced by `salesforce_account_id` / `salesforce_contact_id`.
 */
export function mapLeadForSave(
  lead: LeadRecord,
  saveMode: SaveMode = "create",
  updateScope?: UpdateScope,
): Record<string, unknown> {
  return {
    id: lead.id,
    owner: lead.owner ?? "",
    save_mode: saveMode,
    ...(saveMode === "update" && updateScope ? { update_scope: updateScope } : {}),
    salesforce_account_id: lead.salesforce_account_id ?? "",
    salesforce_contact_id: lead.salesforce_contact_id ?? "",
    contact_name: lead.contact_name,
    contact_gender: lead.contact_gender ?? "",
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
      salesforce_id: lead.salesforce_contact_id ?? "",
      full_name: lead.contact_name,
      gender: lead.contact_gender ?? "",
      email: lead.sender_email,
      phone_country_code: lead.phone_country_code,
      phone_number: lead.phone_number,
      title: lead.contact_title,
      description: lead.suggested_action,
    },
    account: {
      salesforce_id: lead.salesforce_account_id || lead.matched_account_id,
      id: lead.matched_account_id,
      name: lead.account_name || lead.matched_account_name || lead.org_name,
      number: lead.account_number,
      description: lead.account_description,
      website: lead.matched_account_website || (lead.sender_domain ? `https://${lead.sender_domain}` : ""),
      industry: lead.industry,
    },
    saved_at: new Date().toISOString(),
  };
}
