import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Query: /api/v1/admin/rentals?riderId=3&limit=50&offset=0&status=ongoing&from=2025-01-01&to=2025-12-31 */
const QuerySchema = z.object({
    riderId: z.coerce.number().int().positive().optional(),
    rentalId: z.coerce.number().int().optional(),
    status: z.string().trim().optional(),
    from: z.string().datetime({ offset: false }).optional(),  // ISO like 2025-02-01
    to: z.string().datetime({ offset: false }).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    order: z.enum(["created_desc", "start_desc", "start_asc"]).default("created_desc"),
});

function rowToRental(row: any) {
    return {
        rentalId: Number(row.RentalId), // bigint in DB; fine for typical sizes; cast to String if you prefer
        riderId: row.RiderId,
        vehicleId: Number(row.VehicleId),
        planId: row.PlanId,
        startDate: row.StartDate ? new Date(row.StartDate).toISOString() : null,
        expectedReturnDate: row.ExpectedReturnDate ? new Date(row.ExpectedReturnDate).toISOString() : null,
        actualReturnDate: row.ActualReturnDate ? new Date(row.ActualReturnDate).toISOString() : null,
        status: row.Status,
        ratePerDay: Number(row.RatePerDay || 0),
        deposit: Number(row.Deposit || 0),
        payableTotal: Number(row.PayableTotal || 0),
        paidTotal: Number(row.PaidTotal || 0),
        balanceDue: Number(row.BalanceDue ?? (Number(row.PayableTotal || 0) - Number(row.PaidTotal || 0))),
        createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : null,
        updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : null,

        // nice labels for UI
        vehicle: {
            model: row.VehicleModel || null,
            code: row.VehicleCode || null,
        },
        plan: {
            name: row.PlanName || null,
        },
    };
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const parsed = QuerySchema.parse({
            riderId: searchParams.get("riderId") ?? undefined,
            rentalId: searchParams.get("rentalId") ?? undefined,
            status: searchParams.get("status") ?? undefined,
            from: searchParams.get("from") ?? undefined,
            to: searchParams.get("to") ?? undefined,
            limit: searchParams.get("limit") ?? undefined,
            offset: searchParams.get("offset") ?? undefined,
            order: (searchParams.get("order") as any) ?? undefined,
        });

        const pool = await getConnection();
        const r = new sql.Request(pool)
            .input("Limit", sql.Int, parsed.limit)
            .input("Offset", sql.Int, parsed.offset);

        const where: string[] = [];

        if (parsed.riderId) {
            r.input("RiderId", sql.Int, parsed.riderId);
            where.push("re.RiderId = @RiderId");
        }
        if (parsed.rentalId) {
            r.input("RentalId", sql.BigInt, parsed.rentalId);
            where.push("re.RentalId = @RentalId");
        }
        if (parsed.status) {
            r.input("Status", sql.VarChar(20), parsed.status);
            where.push("re.Status = @Status");
        }
        if (parsed.from) {
            r.input("From", sql.DateTime2, parsed.from);
            where.push("re.StartDate >= @From");
        }
        if (parsed.to) {
            r.input("To", sql.DateTime2, parsed.to);
            where.push("re.StartDate < @To");
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const orderBy =
            parsed.order === "start_asc"
                ? "ORDER BY re.StartDate ASC, re.RentalId DESC"
                : parsed.order === "start_desc"
                    ? "ORDER BY re.StartDate DESC, re.RentalId DESC"
                    : "ORDER BY re.CreatedAt DESC, re.RentalId DESC";

        const query = `
      SELECT
        re.RentalId, re.RiderId, re.VehicleId, re.PlanId,
        re.StartDate, re.ExpectedReturnDate, re.ActualReturnDate,
        re.Status, re.RatePerDay, re.Deposit, re.PricingJson,
        re.PayableTotal, re.PaidTotal, re.BalanceDue,
        re.CreatedAt, re.UpdatedAt,
        v.Model        AS VehicleModel,
        v.UniqueCode   AS VehicleCode,
        p.PlanName     AS PlanName
      FROM dbo.Rentals re
      LEFT JOIN dbo.Vehicles v ON v.VehicleId = re.VehicleId
      LEFT JOIN dbo.Plans    p ON p.PlanId    = re.PlanId
      ${whereSql}
      ${orderBy}
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

      SELECT COUNT(1) as Total
      FROM dbo.Rentals re
      ${whereSql};
    `;

        const queryResult = (await r.query<any>(query)) as unknown as sql.IResult<any>;
        const rs = queryResult.recordsets as sql.IRecordSet<any>[]; // <- array

        const list  = (rs[0] ?? []).map(rowToRental);
        const total = rs[1]?.[0]?.Total ?? list.length;


        return NextResponse.json({
            ok: true,
            data: list,
            page: { limit: parsed.limit, offset: parsed.offset, total },
        });
    } catch (err) {
        console.error("GET /admin/rentals error:", err);
        return NextResponse.json({ ok: false, error: "Failed to fetch rentals" }, { status: 500 });
    }
}
