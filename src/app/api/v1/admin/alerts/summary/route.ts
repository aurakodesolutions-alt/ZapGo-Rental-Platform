import { NextResponse } from "next/server";
import { getAlertsSummary } from "@/lib/alerts-service";

export async function GET() {
    const summary = await getAlertsSummary();
    return NextResponse.json({ ok: true, ...summary });
}
