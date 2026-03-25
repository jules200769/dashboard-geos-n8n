import { NextResponse } from "next/server";
import { calculateMetrics, getLeads } from "@/lib/data/leadRepository";

export async function GET() {
  try {
    const leads = await getLeads();
    const metrics = calculateMetrics(leads);
    return NextResponse.json({ leads, metrics });
  } catch (error) {
    console.error("failed to load leads", error);
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}
