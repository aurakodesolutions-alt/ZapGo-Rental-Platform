import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 * - from/to are DATE (UTC). If omitted -> last 30 days (inclusive).
 */
export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;
        const toParam = sp.get("to");
        const fromParam = sp.get("from");
        // default window: last 30 days (inclusive)
        const toDate = toParam ? new Date(toParam) : new Date();
        const fromDate = fromParam
            ? new Date(fromParam)
            : new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate() - 29));

        const pool = await getConnection();

        // KPIs in one round-trip
        const r = await pool.request()
            .input("from", sql.Date, fromDate)
            .input("to",   sql.Date, toDate)
            .query(`
        -- inclusive [from, to]
        DECLARE @fromDate date = @from;
        DECLARE @toDate   date = @to;

        ;WITH rentals_in_range AS (
          SELECT *
          FROM Rentals
          WHERE StartDate < DATEADD(day, 1, @toDate)
            AND (ActualReturnDate IS NULL OR ActualReturnDate >= @fromDate)
        ),
        payments_in_range AS (
          SELECT *
          FROM Payments
          WHERE TransactionStatus='SUCCESS'
            AND TransactionDate >= @fromDate
            AND TransactionDate < DATEADD(day,1,@toDate)
        )
        SELECT
          -- rentals (created in window)
          (SELECT COUNT(*) FROM Rentals WHERE StartDate >= @fromDate AND StartDate < DATEADD(day,1,@toDate)) AS totalRentalsCreated,
          -- status right now (not only created in window)
          (SELECT COUNT(*) FROM Rentals WHERE Status = 'ongoing')  AS ongoing,
          (SELECT COUNT(*) FROM Rentals WHERE Status = 'overdue')  AS overdue,
          (SELECT COUNT(*) FROM Rentals WHERE Status = 'completed') AS completed,
          -- revenue in window
          (SELECT COALESCE(SUM(Amount),0) FROM payments_in_range) AS revenue,
          -- receivables outstanding (current)
          (SELECT COALESCE(SUM(PayableTotal - PaidTotal),0) FROM Rentals WHERE Status IN ('ongoing','overdue')) AS receivables
      `);

        const x = r.recordset[0] || {};
        const data = {
            from: fromDate.toISOString().slice(0,10),
            to:   toDate.toISOString().slice(0,10),
            totalRentalsCreated: Number(x.totalRentalsCreated || 0),
            ongoing:             Number(x.ongoing || 0),
            overdue:             Number(x.overdue || 0),
            completed:           Number(x.completed || 0),
            revenue:             Number(x.revenue || 0),
            receivables:         Number(x.receivables || 0),
        };

        return NextResponse.json({ ok: true, data });
    } catch (err) {
        console.error("GET /reports/summary error:", err);
        return NextResponse.json({ ok:false, error:"Failed to load summary" }, { status: 500 });
    }
}
