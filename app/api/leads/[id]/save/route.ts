import { NextRequest, NextResponse } from "next/server";
import { getLeadById, markLeadSaved } from "@/lib/data/leadRepository";
import {
  mapLeadForSave,
  parseSalesforceIdsFromWebhookBody,
  resolveSalesforceIds,
  type SaveMode,
} from "@/lib/mappers/leadMapper";
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

function summarizeWebhookFailure(body?: string, status?: number): string {
  if (body?.trim()) {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      const message = typeof parsed.message === "string" ? parsed.message : "";
      const hint = typeof parsed.hint === "string" ? parsed.hint : "";
      if (message && hint) return `${message} (${hint})`;
      if (message) return message;
    } catch {
      if (body.length <= 200) return body;
      return `${body.slice(0, 200)}…`;
    }
  }
  return status ? `Webhook gaf HTTP ${status}.` : "Webhook gaf geen bruikbare respons.";
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
    const resolvedIds = resolveSalesforceIds({ ...lead, ...draft });

    const leadForSave: LeadRecord = {
      ...lead,
      ...draft,
      id: lead.id,
      source_message_id: lead.source_message_id,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      saved_at: lead.saved_at,
      status: lead.status,
      salesforce_account_id: resolvedIds.accountId,
      salesforce_contact_id: resolvedIds.contactId,
      raw_payload: {
        ...lead.raw_payload,
        dashboardDraft: draft,
      },
    };

    const isUpdate = lead.status === "saved" || Boolean(resolvedIds.contactId);
    const saveMode: SaveMode = isUpdate ? "update" : "create";

    if (isUpdate && !resolvedIds.contactId) {
      return NextResponse.json(
        {
          error:
            "Deze kaart heeft geen Salesforce contact-ID. Dat gebeurt vaak bij kaarten die vóór de update-functie zijn opgeslagen. Sla de lead opnieuw op vanuit de open wachtrij, of voer de Supabase-migratie uit en sla daarna een nieuwe lead op.",
        },
        { status: 422 },
      );
    }

    const savePayload = mapLeadForSave(leadForSave, saveMode);
    const webhookUrl = isUpdate
      ? process.env.N8N_UPDATE_WEBHOOK_URL || process.env.N8N_SAVE_WEBHOOK_URL
      : process.env.N8N_SAVE_WEBHOOK_URL;

    if (isUpdate && !process.env.N8N_UPDATE_WEBHOOK_URL) {
      console.warn(
        "N8N_UPDATE_WEBHOOK_URL is not set; correction falls back to N8N_SAVE_WEBHOOK_URL (create flow).",
      );
    }

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

    if (isUpdate && webhookUrl && !webhookResult.ok) {
      return NextResponse.json(
        {
          error: "Salesforce bijwerken mislukt.",
          detail: summarizeWebhookFailure(webhookResult.body, webhookResult.status),
          webhook: webhookResult,
        },
        { status: 502 },
      );
    }

    const returnedIds = parseSalesforceIdsFromWebhookBody(webhookResult.body);
    const updated = await markLeadSaved(
      id,
      {
        ...savePayload,
        webhookStatus: webhookResult,
      },
      leadForSave,
      {
        accountId: returnedIds.accountId || resolvedIds.accountId,
        contactId: returnedIds.contactId || resolvedIds.contactId,
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
    const detail = error instanceof Error ? error.message : "Onbekende fout";
    return NextResponse.json(
      {
        error: "Save failed",
        detail,
      },
      { status: 500 },
    );
  }
}
