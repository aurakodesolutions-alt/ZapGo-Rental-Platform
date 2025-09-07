// app/api/v1/admin/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/dashboard?days=14
 * Returns:
 * {
 *   stats: { totalRiders, totalVehicles, vehiclesAvailable, activeRentals, overdueRentals, receivables, paymentsToday, paymentsMonth },
 *   utilization: [{ date, rented, total, utilization }],
 *   earningsDaily: [{ date, amount }],
 *   recentPayments: [...],
 *   recentReturns: [...]
 * }
 */
export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;
        const days = Math.max(7, Math.min(Number(sp.get("days") || 14), 90));

        const pool = await getConnection();

        // ---------- STATS ----------
        const statsQ = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Riders) AS totalRiders,
        (SELECT COALESCE(SUM(Quantity),0) FROM Vehicles) AS totalVehicles,
        (SELECT COALESCE(SUM(CASE WHEN Status='Available' THEN Quantity ELSE 0 END),0) FROM Vehicles) AS vehiclesAvailable,
        (SELECT COUNT(*) FROM Rentals WHERE Status IN ('ongoing','overdue')) AS activeRentals,
        (SELECT COUNT(*) FROM Rentals WHERE Status='overdue' OR (Status='ongoing' AND ExpectedReturnDate < SYSUTCDATETIME())) AS overdueRentals,
        (SELECT COALESCE(SUM(PayableTotal - PaidTotal),0) FROM Rentals WHERE Status IN ('ongoing','overdue')) AS receivables,
        (SELECT COALESCE(SUM(Amount),0) FROM Payments WHERE TransactionStatus='SUCCESS' AND CONVERT(date, TransactionDate) = CONVERT(date, SYSUTCDATETIME())) AS paymentsToday,
        (SELECT COALESCE(SUM(Amount),0) FROM Payments WHERE TransactionStatus='SUCCESS' AND YEAR(TransactionDate)=YEAR(SYSUTCDATETIME()) AND MONTH(TransactionDate)=MONTH(SYSUTCDATETIME())) AS paymentsMonth
    `);
        const stats = statsQ.recordset[0];

        // ---------- VEHICLE UTILIZATION (last N days) ----------
        const utilQ = await pool.request()
            .input("days", sql.Int, days)
            .query(`
        WITH d AS (
          SELECT CAST(CONVERT(date, DATEADD(day, -(@days-1), SYSUTCDATETIME())) AS date) AS Day
          UNION ALL
          SELECT DATEADD(day, 1, Day) FROM d WHERE Day < CAST(CONVERT(date, SYSUTCDATETIME()) AS date)
        ),
        totals AS (
          SELECT COALESCE(SUM(Quantity),0) AS total FROM Vehicles
        ),
        rented AS (
          SELECT
            d.Day,
            COUNT(r.RentalId) AS rented
          FROM d
          LEFT JOIN Rentals r
            ON r.StartDate < DATEADD(day, 1, d.Day)   -- started before end of day
           AND (r.ActualReturnDate IS NULL OR r.ActualReturnDate >= d.Day) -- not returned before day begins
          GROUP BY d.Day
        )
        SELECT
          CONVERT(varchar(10), d.Day, 23) AS date,
          COALESCE(r.rented, 0) AS rented,
          t.total AS total,
          CAST(CASE WHEN t.total=0 THEN 0 ELSE 1.0 * COALESCE(r.rented,0) / t.total END AS decimal(9,4)) AS utilization
        FROM d
        CROSS JOIN totals t
        LEFT JOIN rented r ON r.Day = d.Day
        ORDER BY date;
      `);

        // ---------- EARNINGS BY DAY (last N days) ----------
        const earnQ = await pool.request()
            .input("days", sql.Int, days)
            .query(`
        WITH d AS (
          SELECT CAST(CONVERT(date, DATEADD(day, -(@days-1), SYSUTCDATETIME())) AS date) AS Day
          UNION ALL
          SELECT DATEADD(day, 1, Day) FROM d WHERE Day < CAST(CONVERT(date, SYSUTCDATETIME()) AS date)
        ),
        sums AS (
          SELECT CONVERT(date, TransactionDate) AS Day, SUM(Amount) AS amount
          FROM Payments
          WHERE TransactionStatus='SUCCESS'
            AND TransactionDate >= DATEADD(day, -(@days-1), CONVERT(date, SYSUTCDATETIME()))
          GROUP BY CONVERT(date, TransactionDate)
        )
        SELECT CONVERT(varchar(10), d.Day, 23) AS date, COALESCE(s.amount,0) AS amount
        FROM d
        LEFT JOIN sums s ON s.Day = d.Day
        ORDER BY date;
      `);

        // ---------- RECENT PAYMENTS ----------
        const recentPayQ = await pool.request().query(`
      SELECT TOP 10
        p.PaymentId, p.RentalId, p.Amount, p.PaymentMethod, p.TxnRef,
        p.TransactionStatus, p.TransactionDate,
        r.RiderId, ri.FullName, ri.Phone
      FROM Payments p
      JOIN Rentals r ON r.RentalId = p.RentalId
      JOIN Riders  ri ON ri.RiderId = r.RiderId
      ORDER BY p.TransactionDate DESC;
    `);

        // ---------- RECENT RETURNS ----------
        const recentRetQ = await pool.request().query(`
      SELECT TOP 10
        r.RentalId, r.RiderId, ri.FullName, ri.Phone,
        r.VehicleId, v.UniqueCode, v.Model,
        r.ActualReturnDate,
        r.PayableTotal, r.PaidTotal, (r.PayableTotal - r.PaidTotal) AS BalanceDue,
        ISNULL(i.FinalAmount, 0) AS FinalAmount, ISNULL(i.Settled, 0) AS Settled
      FROM Rentals r
      JOIN Riders ri   ON ri.RiderId = r.RiderId
      JOIN Vehicles v  ON v.VehicleId = r.VehicleId
      LEFT JOIN ReturnInspections i ON i.RentalId = r.RentalId
      WHERE r.Status = 'completed'
      ORDER BY r.ActualReturnDate DESC;
    `);

        const res = {
            stats: {
                totalRiders: Number(stats.totalRiders || 0),
                totalVehicles: Number(stats.totalVehicles || 0),
                vehiclesAvailable: Number(stats.vehiclesAvailable || 0),
                activeRentals: Number(stats.activeRentals || 0),
                overdueRentals: Number(stats.overdueRentals || 0),
                receivables: Number(stats.receivables || 0),
                paymentsToday: Number(stats.paymentsToday || 0),
                paymentsMonth: Number(stats.paymentsMonth || 0),
            },
            utilization: utilQ.recordset.map((r: any) => ({
                date: r.date,
                rented: Number(r.rented || 0),
                total: Number(r.total || 0),
                utilization: Number(r.utilization || 0),
            })),
            earningsDaily: earnQ.recordset.map((r: any) => ({ date: r.date, amount: Number(r.amount || 0) })),
            recentPayments: recentPayQ.recordset.map((p: any) => ({
                paymentId: Number(p.PaymentId),
                rentalId: Number(p.RentalId),
                rider: { riderId: Number(p.RiderId), fullName: p.FullName, phone: p.Phone },
                amount: Number(p.Amount || 0),
                paymentMethod: String(p.PaymentMethod || ""),
                txnRef: p.TxnRef || null,
                transactionStatus: String(p.TransactionStatus || ""),
                transactionDate: p.TransactionDate,
            })),
            recentReturns: recentRetQ.recordset.map((r: any) => ({
                rentalId: Number(r.RentalId),
                rider: { riderId: Number(r.RiderId), fullName: r.FullName, phone: r.Phone },
                vehicle: { vehicleId: Number(r.VehicleId), uniqueCode: r.UniqueCode, model: r.Model },
                actualReturnDate: r.ActualReturnDate,
                payableTotal: Number(r.PayableTotal || 0),
                paidTotal: Number(r.PaidTotal || 0),
                balanceDue: Number(r.BalanceDue || 0),
                finalAmount: Number(r.FinalAmount || 0),
                settled: !!r.Settled,
            })),
        };

        return NextResponse.json({ ok: true, data: res });
    } catch (err: any) {
        console.error("GET /admin/dashboard error:", err);
        return NextResponse.json({ ok: false, error: "Failed to load dashboard" }, { status: 400 });
    }
}
