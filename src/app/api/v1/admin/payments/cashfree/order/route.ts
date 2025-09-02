import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

export async function POST(req: NextRequest) {
    const { orderId, amount, customer } = await req.json();
    const body = {
        order_id: String(orderId),
        order_amount: Number(amount),
        order_currency: "INR",
        customer_details: {
            customer_id: String(customer.id),
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
        },
        order_meta: {
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/booking?cf_id={order_id}&cf_token={payment_session_id}`,
        }
    };

    const r = await fetch(`${BASE}/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-client-id": process.env.CASHFREE_APP_ID!,
            "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
            "x-api-version": "2022-09-01",
        },
        body: JSON.stringify(body),
    });

    if (!r.ok) {
        return NextResponse.json({ error: "Cashfree order failed", details: await r.text() }, { status: 400 });
    }
    const data = await r.json();
    return NextResponse.json({ paymentSessionId: data.payment_session_id || data.order_token, raw: data });
}
