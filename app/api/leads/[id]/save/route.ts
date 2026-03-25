import { NextRequest, NextResponse } from "next/server";
import { getLeadById, markLeadSaved } from "@/lib/data/leadRepository";
import { mapLeadForSave } from "@/lib/mappers/leadMapper";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const lead = await getLeadById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const savePayload = mapLeadForSave(lead);
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
