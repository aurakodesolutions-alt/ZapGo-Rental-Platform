import { NextRequest, NextResponse } from "next/server";

const MODE = process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
const BASE = MODE === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";

// ENV names you said you use:
const APP_ID = process.env.APPID_CASHFREE!;
const SECRET = process.env.SECRET_KEY_CASHFREE!;

export async function POST(req: NextRequest) {
    const { orderId, amount, customer } = await req.json();

    if (!orderId || !amount || !customer?.id || !customer?.email || !customer?.phone) {
        return NextResponse.json({ error: "Missing order details" }, { status: 400 });
    }

    const body = {
        order_id: String(orderId),
        order_amount: Number(amount),
        order_currency: "INR",
        customer_details: {
            customer_id: String(customer.id),
            customer_name: customer.name || "Customer",
            customer_email: customer.email,
            customer_phone: customer.phone,
        },
        order_meta: {
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/booking?cf_id={order_id}`,
            notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/admin/payments/cashfree/webhook`,
        },

    };

    const r = await fetch(`${BASE}/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-client-id": APP_ID,
            "x-client-secret": SECRET,
            "x-api-version": "2022-09-01",
        },
        body: JSON.stringify(body),
    });

    const txt = await r.text();
    if (!r.ok) {
        return NextResponse.json({ error: "Cashfree order failed", details: txt }, { status: 400 });
    }

    const data = JSON.parse(txt);
    // Cashfree may return payment_session_id or order_token depending on API version
    const paymentSessionId = data.payment_session_id || data.order_token;
    return NextResponse.json({ orderId, paymentSessionId, mode: MODE, raw: data });
}
