import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/reports/vehicles?from=&to=&q=&page=1&pageSize=20
 * Trips = count of rentals overlapping window
 * RentedDays = sum of overlapped days (inclusive) per vehicle
 * Utilization = RentedDays / total days in window
 * Revenue = sum of SUCCESS payments for rentals of that vehicle in window
 */
export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;

        const page = Math.max(1, Number(sp.get("page") || 1));
        const pageSize = Math.min(200, Math.max(1, Number(sp.get("pageSize") || 20)));
        const offset = (page - 1) * pageSize;

        const q = (sp.get("q") || "").trim();

        // date window (inclusive)
        const toParam = sp.get("to");
        const fromParam = sp.get("from");
        const toDate = toParam ? new Date(toParam) : new Date();
        const fromDate = fromParam
            ? new Date(fromParam)
            : new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate() - 29));
        const endExclusive = new Date(toDate);
        endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

        const pool = await getConnection();
        const reqDb = pool.request()
            .input("from", sql.Date, fromDate)
            .input("endExclusive", sql.Date, endExclusive)
            .input("offset", sql.Int, offset)
            .input("limit", sql.Int, pageSize)
            // IMPORTANT: always bind @q, even when empty
            .input("q", sql.NVarChar(256), q ? `%${q}%` : null);

        const sqlText = `
            DECLARE @windowDays int = DATEDIFF(day, @from, @endExclusive);

            -- candidate vehicles (search applied here so pagination counts align)
            WITH v AS (
                SELECT VehicleId, UniqueCode, Model
                FROM Vehicles
                WHERE (@q IS NULL OR UniqueCode LIKE @q OR Model LIKE @q)
            ),
                 -- rentals that overlap the date window
                 r_in AS (
                     SELECT
                         r.VehicleId,
                         r.RentalId,
                         CAST(r.StartDate AS date) AS StartD,
                         CAST(ISNULL(r.ActualReturnDate, SYSUTCDATETIME()) AS date) AS EndD
                     FROM Rentals r
                     WHERE r.StartDate < @endExclusive
                       AND (r.ActualReturnDate IS NULL OR r.ActualReturnDate >= @from)
                 ),
                 -- clamp overlap to window and compute inclusive day count
                 overlap AS (
                     SELECT
                         ri.VehicleId,
                         ri.RentalId,
                         CASE WHEN ri.StartD < @from THEN @from ELSE ri.StartD END AS S,
                         CASE WHEN ri.EndD   >= DATEADD(day,-1,@endExclusive) THEN DATEADD(day,-1,@endExclusive) ELSE ri.EndD END AS E
                     FROM r_in ri
                 ),
                 per_rental AS (
                     SELECT
                         o.VehicleId,
                         o.RentalId,
                         CASE
                             WHEN o.S <= o.E
                                 THEN DATEDIFF(day, o.S, DATEADD(day, 1, o.E))  -- inclusive
                             ELSE 0
                             END AS RentedDays
                     FROM overlap o
                 ),
                 agg AS (
                     SELECT
                         v.VehicleId,
                         MIN(v.UniqueCode) AS UniqueCode,
                         MIN(v.Model)      AS Model,
                         COUNT(DISTINCT pr.RentalId) AS Trips,
                         COALESCE(SUM(pr.RentedDays), 0) AS RentedDays
                     FROM v
                              LEFT JOIN per_rental pr ON pr.VehicleId = v.VehicleId
                     GROUP BY v.VehicleId
                 ),
                 rev AS (
                     SELECT r.VehicleId, SUM(p.Amount) AS Revenue
                     FROM Payments p
                              JOIN Rentals r ON r.RentalId = p.RentalId
                     WHERE p.TransactionStatus = 'SUCCESS'
                       AND p.TransactionDate >= @from
                       AND p.TransactionDate <  @endExclusive
                     GROUP BY r.VehicleId
                 ),
                 joined AS (
                     SELECT
                         a.VehicleId,
                         a.UniqueCode,
                         a.Model,
                         a.Trips,
                         a.RentedDays,
                         COALESCE(rv.Revenue, 0) AS Revenue,
                         CAST(CASE WHEN @windowDays <= 0 THEN 0
                                   ELSE 1.0 * a.RentedDays / @windowDays END AS decimal(9,4)) AS Utilization
                     FROM agg a
                              LEFT JOIN rev rv ON rv.VehicleId = a.VehicleId
                 ),
                 numbered AS (
                     SELECT *,
                            ROW_NUMBER() OVER (ORDER BY Revenue DESC, Trips DESC, VehicleId ASC) AS rn,
                            COUNT(*)     OVER () AS Total
                     FROM joined
                 )
            SELECT * FROM numbered
            WHERE rn > @offset AND rn <= (@offset + @limit)
            ORDER BY rn;
        `;

        const rs = await reqDb.query(sqlText);
        const total = rs.recordset.length ? Number(rs.recordset[0].Total) : 0;

        const data = rs.recordset.map((x: any) => ({
            vehicleId: Number(x.VehicleId),
            uniqueCode: x.UniqueCode,
            model: x.Model,
            trips: Number(x.Trips || 0),
            rentedDays: Number(x.RentedDays || 0),
            revenue: Number(x.Revenue || 0),
            utilization: Number(x.Utilization || 0),
        }));

        return NextResponse.json({ ok: true, total, page, pageSize, data });
    } catch (err) {
        console.error("GET /reports/vehicles error:", err);
        return NextResponse.json({ ok: false, error: "Failed to load vehicle performance" }, { status: 500 });
    }
}
