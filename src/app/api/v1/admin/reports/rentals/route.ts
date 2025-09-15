import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/reports/rentals?from=&to=&status=&q=&page=1&pageSize=20
 * Filters by StartDate within [from, to] inclusive.
 * status: ongoing | overdue | completed (optional)
 */
export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;

        const page = Math.max(1, Number(sp.get("page") || 1));
        const pageSize = Math.min(200, Math.max(1, Number(sp.get("pageSize") || 20)));
        const offset = (page - 1) * pageSize;

        const q = (sp.get("q") || "").trim();
        const status = (sp.get("status") || "").trim().toLowerCase();

        // date window (inclusive)
        const toParam = sp.get("to");
        const fromParam = sp.get("from");
        const toDate = toParam ? new Date(toParam) : new Date();
        const fromDate = fromParam ? new Date(fromParam) : new Date(Date.UTC(
            toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate() - 29
        ));
        const endExclusive = new Date(toDate);
        endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

        const pool = await getConnection();
        const reqDb = pool.request()
            .input("from", sql.Date, fromDate)
            .input("endExclusive", sql.Date, endExclusive)
            .input("offset", sql.Int, offset)
            .input("limit", sql.Int, pageSize);

        // Base time-window: rentals whose StartDate falls inside the range
        let where = `
      r.StartDate >= @from
      AND r.StartDate < @endExclusive
    `;

        // Status filter
        if (status) {
            if (status === "overdue") {
                // Overdue now or logically overdue within the window
                where += ` AND (r.Status = 'overdue' OR (r.Status = 'ongoing' AND r.ActualReturnDate < SYSUTCDATETIME()))`;
            } else {
                reqDb.input("status", sql.VarChar(12), status);
                where += ` AND r.Status = @status`;
            }
        }

        // Optional search
        if (q) {
            reqDb.input("q", sql.NVarChar(256), `%${q}%`);
            where += `
        AND (
          ri.FullName LIKE @q OR ri.Phone LIKE @q
          OR v.UniqueCode LIKE @q OR v.Model LIKE @q
          OR CONVERT(nvarchar(50), r.RentalId) LIKE @q
        )
      `;
        }

        const sqlText = `
      WITH base AS (
        SELECT
          r.RentalId,
          r.RiderId, ri.FullName, ri.Phone,
          r.VehicleId, v.UniqueCode, v.Model,
          r.StartDate, r.ActualReturnDate, r.Status,
          r.PayableTotal, r.PaidTotal,
          (r.PayableTotal - r.PaidTotal) AS BalanceDue
        FROM Rentals r
        JOIN Riders  ri ON ri.RiderId  = r.RiderId
        JOIN Vehicles v ON v.VehicleId = r.VehicleId
        WHERE ${where}
      ),
      numbered AS (
        SELECT
          *,
          ROW_NUMBER() OVER (ORDER BY StartDate DESC, RentalId DESC) AS rn,
          COUNT(*)     OVER () AS Total
        FROM base
      )
      SELECT * FROM numbered
      WHERE rn > @offset AND rn <= (@offset + @limit)
      ORDER BY rn;
    `;

        const rs = await reqDb.query(sqlText);
        const total = rs.recordset.length ? Number(rs.recordset[0].Total) : 0;

        const data = rs.recordset.map((x: any) => ({
            rentalId: Number(x.RentalId),
            rider: { riderId: Number(x.RiderId), fullName: x.FullName, phone: x.Phone },
            vehicle: { vehicleId: Number(x.VehicleId), uniqueCode: x.UniqueCode, model: x.Model },
            startDate: x.StartDate,
            actualReturnDate: x.ActualReturnDate,
            status: String(x.Status),
            payableTotal: Number(x.PayableTotal || 0),
            paidTotal: Number(x.PaidTotal || 0),
            balanceDue: Number(x.BalanceDue || 0),
        }));

        return NextResponse.json({ ok: true, total, page, pageSize, data });
    } catch (err) {
        console.error("GET /reports/rentals error:", err);
        return NextResponse.json({ ok:false, error:"Failed to load rentals" }, { status: 500 });
    }
}
