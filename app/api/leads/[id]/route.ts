import { NextResponse, type NextRequest } from "next/server";
import { deleteLead, getLeadById } from "@/lib/data/leadRepository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const lead = await getLeadById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    await deleteLead(id);
    return NextResponse.json({ message: "Lead verwijderd." });
  } catch (error) {
    console.error("failed to delete lead", error);
    return NextResponse.json({ error: "Verwijderen mislukt." }, { status: 500 });
  }
}
