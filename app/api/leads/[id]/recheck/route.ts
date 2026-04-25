import { NextRequest, NextResponse } from "next/server";
import { getLeadById, markLeadRechecked } from "@/lib/data/leadRepository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface RecheckResult {
  existsInSalesforce: boolean;
  matchedIn: string[];
  reason: string;
  checkedAt?: string;
  source?: string;
  rawAgentOutput?: unknown;
}

function toMatchedIn(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function unwrapRecheckPayload(payload: unknown): Record<string, unknown> {
  const first = Array.isArray(payload) ? payload[0] : payload;
  const base = asObject(first);
  const nestedJson = asObject(base.json);
  const candidate = Object.keys(nestedJson).length > 0 ? nestedJson : base;

  if (typeof candidate.output === "string") {
    const jsonMatch = candidate.output.match(/\{[\s\S]*\}/);
    try {
      return JSON.parse(jsonMatch ? jsonMatch[0] : candidate.output) as Record<string, unknown>;
    } catch {
      return { reason: candidate.output };
    }
  }

  const outputObject = asObject(candidate.output);
  return Object.keys(outputObject).length > 0 ? outputObject : candidate;
}

function normalizeRecheckResult(payload: unknown): RecheckResult {
  const result = unwrapRecheckPayload(payload);
  const reason = typeof result.reason === "string" ? result.reason.trim() : "";
  return {
    existsInSalesforce: result.existsInSalesforce === true,
    matchedIn: toMatchedIn(result.matchedIn),
    reason: reason || "Salesforce re-check afgerond zonder extra toelichting.",
    checkedAt: typeof result.checkedAt === "string" ? result.checkedAt : undefined,
    source: typeof result.source === "string" ? result.source : undefined,
    rawAgentOutput: result.rawAgentOutput,
  };
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const lead = await getLeadById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const webhookUrl = process.env.N8N_RECHECK_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: "Re-check webhook not configured" }, { status: 500 });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: lead.id,
        contact_name: lead.contact_name,
        org_name: lead.org_name,
        sender_email: lead.sender_email,
        sender_domain: lead.sender_domain,
        match_reason: lead.match_reason,
      }),
    });

    const responseText = await response.text();
    let responsePayload: unknown = {};
    try {
      responsePayload = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      responsePayload = { reason: responseText };
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Re-check failed", webhook: { status: response.status, body: responseText } },
        { status: 502 },
      );
    }

    const result = normalizeRecheckResult(responsePayload);
    const updated = await markLeadRechecked(id, {
      existsInSalesforce: result.existsInSalesforce,
      matchedIn: result.matchedIn,
      reason: result.reason,
      rawPayload: {
        ...lead.raw_payload,
        salesforce_recheck: {
          ...result,
          webhookStatus: {
            ok: response.ok,
            status: response.status,
          },
        },
      },
    });

    return NextResponse.json({
      lead: updated,
      recheck: result,
      message: "Salesforce-controle bijgewerkt.",
    });
  } catch (error) {
    console.error("lead re-check failed", error);
    return NextResponse.json({ error: "Re-check failed" }, { status: 500 });
  }
}
