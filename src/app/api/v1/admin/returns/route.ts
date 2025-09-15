// app/api/v1/admin/returns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/returns?scope=due-today|overdue|recent&q=search&limit=50&offset=0
 */
export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;
        const scope = (sp.get("scope") || "overdue").toLowerCase();
        const q = (sp.get("q") || "").trim();
        const limit = Math.max(1, Math.min(Number(sp.get("limit") || 50), 200));
        const offset = Math.max(0, Number(sp.get("offset") || 0));

        const pool = await getConnection();
        const request = new sql.Request(pool);

        request.input("limit", sql.Int, limit);
        request.input("offset", sql.Int, offset);

        // Optional search across rider/vehicle/rental id
        let whereSearch = "";
        if (q) {
            request.input("q", sql.NVarChar(256), `%${q}%`);
            whereSearch = `
        AND (
          ri.FullName LIKE @q
          OR v.UniqueCode LIKE @q
          OR v.Model LIKE @q
          OR CONVERT(nvarchar(50), r.RentalId) LIKE @q
        )
      `;
        }

        // Scope predicates (used INSIDE the CTE, so `r` is valid)
        let scopeWhere = "";
        let orderBy = "";
        switch (scope) {
            case "due-today":
            case "due_today":
                // Treat DueDate as the expected date for ongoing/overdue; fall back to actual if needed
                scopeWhere = `
          r.Status IN ('ongoing','overdue')
          AND CONVERT(date, COALESCE(r.ExpectedReturnDate, r.ActualReturnDate))
              = CONVERT(date, SYSUTCDATETIME())
        `;
                orderBy = "ORDER BY DueDate ASC, RentalId ASC";
                break;

            case "recent":
                scopeWhere = `
          r.Status = 'completed'
          AND r.ActualReturnDate IS NOT NULL
          AND r.ActualReturnDate >= DATEADD(day, -7, SYSUTCDATETIME())
        `;
                orderBy = "ORDER BY ActualReturnDate DESC, RentalId DESC";
                break;

            case "overdue":
            default:
                // Match dashboard: 'overdue' OR ('ongoing' and expected due passed)
                scopeWhere = `
          (r.Status = 'overdue')
          OR (
            r.Status = 'ongoing'
            AND COALESCE(r.ExpectedReturnDate, r.ActualReturnDate) < SYSUTCDATETIME()
          )
        `;
                orderBy = "ORDER BY DueDate ASC, RentalId ASC";
                break;
        }

        const sqlText = `
            WITH rows AS (
                SELECT
                    r.RentalId,
                    r.RiderId,
                    ri.FullName, ri.Phone,
                    r.VehicleId,
                    v.UniqueCode, v.Model,
                    r.PlanId,
                    p.PlanName,
                    r.StartDate,
                    r.ExpectedReturnDate,
                    r.ActualReturnDate,
                    /* Unified date used for 'overdue'/'due-today' ordering & filtering */
                    CASE
                        WHEN r.Status IN ('ongoing','overdue')
                            THEN COALESCE(r.ExpectedReturnDate, r.ActualReturnDate)
                        ELSE r.ActualReturnDate
                        END AS DueDate,
                    r.Status,
                    r.PayableTotal, r.PaidTotal,
                    (r.PayableTotal - r.PaidTotal) AS BalanceDue
                FROM Rentals r
                         JOIN Riders  ri ON ri.RiderId  = r.RiderId
                         JOIN Vehicles v ON v.VehicleId = r.VehicleId
                         LEFT JOIN Plans p ON p.PlanId   = r.PlanId
                WHERE (${scopeWhere}) ${whereSearch}
                )
            SELECT *
            FROM rows
                     ${orderBy}
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
        `;

        const res = await request.query(sqlText);

        const rows = res.recordset.map((r: any) => ({
            rentalId: Number(r.RentalId),
            rider: { riderId: Number(r.RiderId), fullName: r.FullName, phone: r.Phone },
            vehicle: { vehicleId: Number(r.VehicleId), uniqueCode: r.UniqueCode, model: r.Model },
            plan: { planId: Number(r.PlanId), planName: r.PlanName },
            startDate: r.StartDate,
            expectedReturnDate: r.ExpectedReturnDate,
            actualReturnDate: r.ActualReturnDate,
            dueDate: r.DueDate, // unified date used for overdue/due-today lists
            status: String(r.Status),
            payableTotal: Number(r.PayableTotal),
            paidTotal: Number(r.PaidTotal),
            balanceDue: Number(r.BalanceDue),
        }));

        return NextResponse.json({ ok: true, data: rows });
    } catch (err: any) {
        console.error("GET /admin/returns error:", err);
        return NextResponse.json({ ok: false, error: "Failed to load returns" }, { status: 400 });
    }
}
