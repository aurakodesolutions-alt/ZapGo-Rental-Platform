// src/app/api/v1/rider/summary/route.ts
import {NextRequest, NextResponse} from "next/server";
import { getConnection, sql } from "@/lib/db";
import {getRiderIdFromRequest} from "@/lib/auth/auth-rider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const riderId = await getRiderIdFromRequest(req);
        if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const pool = await getConnection();

        // Active/current rental (latest ongoing/confirmed)
        const activeQ = await pool.request()
            .input("rid", sql.Int, riderId)
            .query(`
        SELECT TOP 1
          r.RentalId, r.Status, r.StartDate, r.ExpectedReturnDate,
          r.PayableTotal, r.PaidTotal, r.BalanceDue,
          v.VehicleId, v.Model,
          p.PlanId, p.PlanName
        FROM Rentals r
        JOIN Vehicles v ON v.VehicleId = r.VehicleId
        JOIN Plans p    ON p.PlanId    = r.PlanId
        WHERE r.RiderId = @rid AND r.Status IN ('CONFIRMED','ONGOING')
        ORDER BY r.CreatedAt DESC;
      `);

        // Aggregates
        const aggQ = await pool.request()
            .input("rid", sql.Int, riderId)
            .query(`
        SELECT
          SUM(CASE WHEN Status IN ('CONFIRMED','ONGOING') THEN 1 ELSE 0 END) AS ActiveRentals,
          SUM(CASE WHEN BalanceDue > 0 THEN BalanceDue ELSE 0 END)          AS BalanceDue,
          SUM(PaidTotal)                                                     AS TotalPaid
        FROM Rentals WHERE RiderId=@rid;
      `);

        // Last payment
        const payQ = await pool.request()
            .input("rid", sql.Int, riderId)
            .query(`
        SELECT TOP 1 PaymentId, Amount, TransactionDate, TransactionStatus
        FROM Payments
        WHERE RiderId = @rid
        ORDER BY TransactionDate DESC;
      `);

        const active = activeQ.recordset[0] || null;
        const agg = aggQ.recordset[0] || { ActiveRentals: 0, BalanceDue: 0, TotalPaid: 0 };
        const lastPayment = payQ.recordset[0] || null;

        return NextResponse.json({
            activeRental: active,
            stats: {
                activeRentals: Number(agg.ActiveRentals || 0),
                balanceDue: Number(agg.BalanceDue || 0),
                totalPaid: Number(agg.TotalPaid || 0),
            },
            lastPayment,
        });
    } catch (e: any) {
        const msg = e?.message === "UNAUTHORIZED" ? "Unauthorized" : (e?.message || "Failed");
        return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
    }
}
