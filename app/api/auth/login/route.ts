import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Dashboardtoegang is tijdelijk gepauzeerd." },
    { status: 503 },
  );
}
