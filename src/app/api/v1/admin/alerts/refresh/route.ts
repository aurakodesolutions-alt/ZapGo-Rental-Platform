import { NextRequest, NextResponse } from "next/server";
import { refreshAlerts } from "@/lib/alerts-service";

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const dueSoonDays = body?.dueSoonDays ?? 3;
    const startingSoonDays = body?.startingSoonDays ?? 7;

    await refreshAlerts({ dueSoonDays, startingSoonDays });
    return NextResponse.json({ ok: true });
}
