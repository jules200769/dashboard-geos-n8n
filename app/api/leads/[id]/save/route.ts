import { NextRequest, NextResponse } from "next/server";
import { getLeadById, markLeadSaved } from "@/lib/data/leadRepository";
import { mapLeadForSave, type SaveMode } from "@/lib/mappers/leadMapper";
import type { LeadRecord } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function asDraft(value: unknown): Partial<LeadRecord> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const payload = value as { lead?: unknown };
  if (!payload.lead || typeof payload.lead !== "object" || Array.isArray(payload.lead)) return {};
  return payload.lead as Partial<LeadRecord>;
}

/** Read a string field from the (possibly array-wrapped) n8n webhook response. */
function pickString(source: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

/** Extract the Salesforce Ids that n8n returns so we can update instead of duplicate next time. */
function parseWebhookIds(body?: string): { accountId: string; contactId: string } {
  if (!body) return { accountId: "", contactId: "" };
  try {
    const parsed = JSON.parse(body);
    const record = (Array.isArray(parsed) ? parsed[0] : parsed) as Record<string, unknown> | null;
    if (!record || typeof record !== "object") return { accountId: "", contactId: "" };
    return {
      accountId: pickString(record, "salesforce_account_id", "accountId", "account_id"),
      contactId: pickString(record, "salesforce_contact_id", "contactId", "contact_id"),
    };
  } catch {
    return { accountId: "", contactId: "" };
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const lead = await getLeadById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const requestPayload = await request.json().catch(() => ({}));
    const draft = asDraft(requestPayload);
    const leadForSave: LeadRecord = {
      ...lead,
      ...draft,
      id: lead.id,
      source_message_id: lead.source_message_id,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      saved_at: lead.saved_at,
      status: lead.status,
      raw_payload: {
        ...lead.raw_payload,
        dashboardDraft: draft,
      },
    };

    // A correction of an already-saved card updates the existing Salesforce record.
    const isUpdate = Boolean(lead.salesforce_contact_id) || lead.status === "saved";
    const saveMode: SaveMode = isUpdate ? "update" : "create";

    const savePayload = mapLeadForSave(leadForSave, saveMode);
    const webhookUrl = isUpdate
      ? process.env.N8N_UPDATE_WEBHOOK_URL || process.env.N8N_SAVE_WEBHOOK_URL
      : process.env.N8N_SAVE_WEBHOOK_URL;

    let webhookResult: { ok: boolean; status?: number; body?: string } = { ok: false };
    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savePayload),
      });
      webhookResult = {
        ok: response.ok,
        status: response.status,
        body: await response.text(),
      };
    }

    const returnedIds = parseWebhookIds(webhookResult.body);
    const updated = await markLeadSaved(
      id,
      {
        ...savePayload,
        webhookStatus: webhookResult,
      },
      leadForSave,
      {
        accountId: returnedIds.accountId || lead.salesforce_account_id,
        contactId: returnedIds.contactId || lead.salesforce_contact_id,
      },
    );

    const okMessage = isUpdate
      ? "Correctie opgeslagen en bijgewerkt in Salesforce."
      : "Lead opgeslagen in dashboard en doorgestuurd.";

    return NextResponse.json({
      lead: updated,
      webhook: webhookResult,
      mode: saveMode,
      message: webhookResult.ok || !webhookUrl
        ? okMessage
        : "Lead opgeslagen, maar webhook gaf een foutstatus.",
    });
  } catch (error) {
    console.error("save lead failed", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
