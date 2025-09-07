import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Query: /api/v1/admin/payments?riderId=3&limit=50&offset=0&rentalId=123 */
const QuerySchema = z.object({
    riderId: z.coerce.number().int().positive().optional(),
    rentalId: z.coerce.number().int().optional(),
    status: z.string().trim().optional(), // SUCCESS, FAILED, PENDING, etc.
    from: z.string().datetime({ offset: false }).optional(),
    to: z.string().datetime({ offset: false }).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    order: z.enum(["date_desc", "date_asc"]).default("date_desc"),
});

function rowToPayment(row: any) {
    return {
        paymentId: Number(row.PaymentId),
        rentalId: Number(row.RentalId),
        riderId: row.RiderId,
        amount: Number(row.Amount || 0),
        method: row.PaymentMethod,
        txnRef: row.TxnRef || null,
        transactionDate: row.TransactionDate ? new Date(row.TransactionDate).toISOString() : null,
        transactionStatus: row.TransactionStatus || null,
        createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : null,
        updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : null,

        // helpful labels
        rider: {
            name: row.RiderName || null,
            phone: row.RiderPhone || null,
        },
        rental: {
            status: row.RentalStatus || null,
        },
        vehicle: {
            model: row.VehicleModel || null,
            code: row.VehicleCode || null,
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
            where.push("pay.RiderId = @RiderId");
        }
        if (parsed.rentalId) {
            r.input("RentalId", sql.BigInt, parsed.rentalId);
            where.push("pay.RentalId = @RentalId");
        }
        if (parsed.status) {
            r.input("PStatus", sql.VarChar(20), parsed.status);
            where.push("pay.TransactionStatus = @PStatus");
        }
        if (parsed.from) {
            r.input("From", sql.DateTime2, parsed.from);
            where.push("pay.TransactionDate >= @From");
        }
        if (parsed.to) {
            r.input("To", sql.DateTime2, parsed.to);
            where.push("pay.TransactionDate < @To");
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const orderBy =
            parsed.order === "date_asc"
                ? "ORDER BY pay.TransactionDate ASC, pay.PaymentId DESC"
                : "ORDER BY pay.TransactionDate DESC, pay.PaymentId DESC";

        const query = `
      SELECT
        pay.PaymentId, pay.RentalId, pay.RiderId,
        pay.Amount, pay.PaymentMethod, pay.TxnRef,
        pay.TransactionDate, pay.TransactionStatus,
        pay.CreatedAt, pay.UpdatedAt,

        r.FullName AS RiderName, r.Phone AS RiderPhone,
        re.Status   AS RentalStatus,
        v.Model     AS VehicleModel,
        v.UniqueCode AS VehicleCode
      FROM dbo.Payments pay
      LEFT JOIN dbo.Rentals  re ON re.RentalId  = pay.RentalId
      LEFT JOIN dbo.Riders   r  ON r.RiderId    = pay.RiderId
      LEFT JOIN dbo.Vehicles v  ON v.VehicleId  = re.VehicleId
      ${whereSql}
      ${orderBy}
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

      SELECT COUNT(1) as Total
      FROM dbo.Payments pay
      ${whereSql};
    `;

        const queryResult = (await r.query<any>(query)) as unknown as sql.IResult<any>;
        const rs = queryResult.recordsets as sql.IRecordSet<any>[]; // <- array

        const list  = (rs[0] ?? []).map(rowToPayment);
        const total = rs[1]?.[0]?.Total ?? list.length;


        return NextResponse.json({
            ok: true,
            data: list,
            page: { limit: parsed.limit, offset: parsed.offset, total },
        });
    } catch (err) {
        console.error("GET /admin/payments error:", err);
        return NextResponse.json({ ok: false, error: "Failed to fetch payments" }, { status: 500 });
    }
}
