import { NextRequest, NextResponse } from "next/server";

// TODO: validate signature (x-webhook-signature) if you set a secret in Cashfree dashboard.
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        console.log("Cashfree webhook:", payload);

        // Example: if (payload?.data?.order?.order_status === "PAID") { ...update Rentals/Payments... }

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ ok: false }, { status: 400 });
    }
}
