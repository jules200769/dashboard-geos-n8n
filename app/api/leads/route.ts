import { NextResponse } from "next/server";
import { calculateMetrics, getLeads } from "@/lib/data/leadRepository";
import { getSessionUserId } from "@/lib/auth/currentUser";

export async function GET() {
  try {
    const owner = await getSessionUserId();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const leads = await getLeads(owner);
    const metrics = calculateMetrics(leads);
    return NextResponse.json({ leads, metrics });
  } catch (error) {
    console.error("failed to load leads", error);
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}
