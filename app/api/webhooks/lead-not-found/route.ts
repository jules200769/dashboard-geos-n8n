import { NextRequest, NextResponse } from "next/server";
import { mapIncomingPayload, shouldIngestLead } from "@/lib/mappers/leadMapper";
import { upsertLead } from "@/lib/data/leadRepository";

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.N8N_WEBHOOK_SECRET;
  if (!expected) return true;
  return request.headers.get("x-webhook-secret") === expected;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    if (!shouldIngestLead(payload)) {
      return NextResponse.json({
        accepted: false,
        reason: "Skipped because record already exists in Salesforce.",
      });
    }

    const mapped = mapIncomingPayload(payload);
    const lead = await upsertLead(mapped);
    return NextResponse.json({ accepted: true, lead });
  } catch (error) {
    console.error("lead-not-found webhook failed", error);
    return NextResponse.json(
      { error: "Invalid payload or server failure." },
      { status: 400 },
    );
  }
}
