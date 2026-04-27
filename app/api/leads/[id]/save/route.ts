import { NextRequest, NextResponse } from "next/server";
import { getLeadById, markLeadSaved } from "@/lib/data/leadRepository";
import { mapLeadForSave } from "@/lib/mappers/leadMapper";
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

    const savePayload = mapLeadForSave(leadForSave);
    const webhookUrl = process.env.N8N_SAVE_WEBHOOK_URL;

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

    const updated = await markLeadSaved(id, {
      ...savePayload,
      webhookStatus: webhookResult,
    });

    return NextResponse.json({
      lead: updated,
      webhook: webhookResult,
      message: webhookResult.ok || !webhookUrl
        ? "Lead opgeslagen in dashboard en doorgestuurd."
        : "Lead opgeslagen, maar webhook gaf een foutstatus.",
    });
  } catch (error) {
    console.error("save lead failed", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
