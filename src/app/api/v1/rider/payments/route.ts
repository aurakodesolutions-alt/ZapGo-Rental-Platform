// src/app/api/v1/rider/payments/route.ts
import {NextRequest, NextResponse} from "next/server";
import { getConnection, sql } from "@/lib/db";
import { getRiderIdFromRequest } from "@/lib/auth/auth-rider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const riderId = await getRiderIdFromRequest(req);
        if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const pool = await getConnection();
        const res = await pool.request()
            .input("rid", sql.Int, riderId)
            .query(`
        SELECT PaymentId, RentalId, Amount, PaymentMethod, TxnRef,
               TransactionDate, TransactionStatus
        FROM Payments
        WHERE RiderId=@rid
        ORDER BY TransactionDate DESC;
      `);
        return NextResponse.json({ items: res.recordset });
    } catch (e: any) {
        const msg = e?.message === "UNAUTHORIZED" ? "Unauthorized" : (e?.message || "Failed");
        return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
    }
}
