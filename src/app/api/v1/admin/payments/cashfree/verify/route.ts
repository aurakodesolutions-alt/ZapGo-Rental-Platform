import { NextRequest, NextResponse } from "next/server";

const MODE = process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
const BASE = MODE === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
const APP_ID = process.env.APPID_CASHFREE!;
const SECRET = process.env.SECRET_KEY_CASHFREE!;

export async function POST(req: NextRequest) {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const r = await fetch(`${BASE}/orders/${encodeURIComponent(orderId)}/payments`, {
        headers: {
            "x-client-id": APP_ID,
            "x-client-secret": SECRET,
            "x-api-version": "2022-09-01",
        },
    });

    const text = await r.text();
    if (!r.ok) return NextResponse.json({ error: "verify failed", details: text }, { status: 400 });

    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }

    // Normalize possible shapes
    const payments: any[] =
        Array.isArray(data) ? data :
            Array.isArray(data?.payments) ? data.payments :
                Array.isArray(data?.data?.payments) ? data.data.payments :
                    [];

    // Pick latest by payment_time / completion_time
    const latest = payments
        .slice()
        .sort((a, b) =>
            new Date(b.payment_time || b.payment_completion_time || 0).getTime() -
            new Date(a.payment_time || a.payment_completion_time || 0).getTime()
        )[0] || null;

    const status = String(latest?.payment_status || data?.payment_status || "UNKNOWN").toUpperCase();

    return NextResponse.json({
        status,                                  // SUCCESS | FAILED | PENDING | UNKNOWN
        captured: !!latest?.is_captured,
        orderAmount: Number(latest?.order_amount ?? data?.order_amount ?? 0),
        paidAmount: Number(latest?.payment_amount ?? data?.payment_amount ?? 0),
        gatewayRef: latest?.cf_payment_id || latest?.payment_gateway_details?.gateway_payment_id || null,
        raw: data,
    });
}
