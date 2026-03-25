import { NextResponse } from "next/server";
import { calculateMetrics, getLeads } from "@/lib/data/leadRepository";

export async function GET() {
  try {
    const leads = await getLeads();
    const metrics = calculateMetrics(leads);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("failed to load metrics", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
