import { NextRequest, NextResponse } from "next/server";
import { getRiderIdFromRequest } from "@/lib/auth/auth-rider";
import { getConnection, sql } from "@/lib/db";

const MODE = process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
const BASE = MODE === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
const APP_ID = process.env.APPID_CASHFREE!;
const SECRET = process.env.SECRET_KEY_CASHFREE!;
const SITE = process.env.NEXT_PUBLIC_SITE_URL!; // e.g., https://zap-go-rental-platform.vercel.app

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const rid = await getRiderIdFromRequest(req);
    if (!rid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rentalId = Number((await (props.params)).id);
    const { amount } = await req.json().catch(() => ({}));
    if (!rentalId || !amount || amount <= 0) return NextResponse.json({ error: "amount required" }, { status: 400 });

    // Get rider contact info for order payload
    const pool = await getConnection();
    const r = await pool.request().input("rid", sql.Int, rid).query(`SELECT FullName, Email, Phone FROM Riders WHERE RiderId=@rid`);
    const me = r.recordset[0] || { FullName: "Rider", Email: "noreply@example.com", Phone: "9999999999" };

    const orderId = `DUE-${rentalId}-${Date.now()}`;

    const cf = await fetch(`${BASE}/orders`, {
        method: "POST",
        headers: {
            "x-client-id": APP_ID,
            "x-client-secret": SECRET,
            "x-api-version": "2022-09-01",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            order_id: orderId,
            order_amount: Number(amount),
            order_currency: "INR",
            customer_details: {
                customer_id: String(rid),
                customer_name: me.FullName,
                customer_email: me.Email,
                customer_phone: me.Phone,
            },
            order_meta: {
                return_url: `${SITE}/booking/success?cf_id=${orderId}`,
                notify_url: `${SITE}/api/v1/payments/cashfree/webhook`,
            },
        }),
    });

    const data = await cf.json();
    if (!cf.ok) return NextResponse.json({ error: "cashfree order failed", details: data }, { status: 400 });

    return NextResponse.json({
        orderId,
        paymentSessionId: data?.payment_session_id || "{payment_session_id}",
        // simple hosted-checkout URL you can open:
        checkoutUrl: `${MODE === "production" ? "https://payments.cashfree.com" : "https://sandbox.cashfree.com"}/pg/checkout?order_id=${encodeURIComponent(orderId)}&payment_session_id=${encodeURIComponent(data?.payment_session_id || "{payment_session_id}")}`,
    });
}
