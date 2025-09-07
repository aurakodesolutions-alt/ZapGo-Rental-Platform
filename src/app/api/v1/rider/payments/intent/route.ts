// src/app/api/v1/rider/payments/intent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRiderIdFromRequest } from "@/lib/auth/auth-rider";

const MODE = process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
const CF_BASE = MODE === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
const APP_ID = process.env.APPID_CASHFREE!;
const SECRET = process.env.SECRET_KEY_CASHFREE!;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const riderId = await getRiderIdFromRequest(req);
        if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { amount, rentalId, purpose = "TOPUP" } = await req.json();

        if (!amount || Number(amount) <= 0) {
            return NextResponse.json({ error: "amount required" }, { status: 400 });
        }

        const orderId = `RID-${riderId}-${Date.now()}`;
        const origin = req.nextUrl.origin;

        const body = {
            order_id: orderId,
            order_amount: Number(amount),
            order_currency: "INR",
            order_note: `${purpose}${rentalId ? ` for rental ${rentalId}` : ""}`,
            customer_details: {
                customer_id: `${riderId}`,
            },
            order_meta: {
                return_url: `${origin}/booking/success?cf_id={order_id}`,
            },
        };

        const r = await fetch(`${CF_BASE}/orders`, {
            method: "POST",
            headers: {
                "x-client-id": APP_ID,
                "x-client-secret": SECRET,
                "x-api-version": "2022-09-01",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const txt = await r.text();
        if (!r.ok) {
            return NextResponse.json({ error: "cashfree create failed", details: txt }, { status: 400 });
        }

        const data = JSON.parse(txt);
        // Return what client needs to open Cashfree checkout
        return NextResponse.json({
            orderId,
            payment_session_id: data?.payment_session_id,
        });
    } catch (e: any) {
        const msg = e?.message === "UNAUTHORIZED" ? "Unauthorized" : (e?.message || "Failed");
        return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
    }
}
