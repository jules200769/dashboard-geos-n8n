export type LeadStatus = "open" | "saved";

export const INDUSTRY_OPTIONS = [
  "admixtures",
  "aggregates (incl. armourstone)",
  "concrete",
  "natural stone (incl. rocks)",
  "soil",
  "diverse",
  "masonry",
  "prefabricated concrete",
  "cement",
  "fly ash",
  "gypsum",
  "slags",
  "bitumen",
  "fillers",
  "asphalt",
  "competitor",
] as const;

export type Industry = (typeof INDUSTRY_OPTIONS)[number];

export interface LeadRecord {
  id: string;
  source_message_id: string | null;
  contact_name: string;
  org_name: string;
  sender_email: string;
  sender_domain: string;
  phone_country_code?: string;
  phone_number?: string;
  subject: string;
  sentiment: string;
  sentiment_confidence: string;
  primary_topic: string;
  secondary_topics: string;
  intent: string;
  urgency_score: number;
  budget_mentioned: boolean;
  event_referenced: string;
  suggested_action: string;
  industry: Industry;
  email_body: string;
  exists_in_salesforce: boolean;
  matched_in: string[];
  match_reason: string;
  lead_rating: "Hot" | "Warm" | "Cold";
  status: LeadStatus;
  save_payload: Record<string, unknown>;
  raw_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  saved_at: string | null;
}

export interface LeadListResponse {
  leads: LeadRecord[];
}

export interface MetricsResponse {
  openLeads: number;
  savedToday: number;
  estimatedTimeSavedMinutes: number;
  openVsSavedSeries: Array<{ day: string; open: number; saved: number }>;
  sentimentMix: Array<{ name: string; value: number }>;
  topicSeries: Array<{ topic: string; count: number }>;
  intentSeries: Array<{ intent: string; count: number }>;
}
