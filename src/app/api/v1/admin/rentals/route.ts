import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConnection, sql } from "@/lib/db";
import { differenceInCalendarDays, parseISO } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Example:
 * /api/v1/admin/rentals?q=ola&status=ongoing&limit=50&offset=0&order=created_desc
 */
const QuerySchema = z.object({
    q: z.string().trim().optional(),
    status: z.string().trim().optional(), // ongoing | completed | overdue | cancelled (whatever you use)
    from: z.string().datetime({ offset: false }).optional(), // filter by StartDate >= from
    to: z.string().datetime({ offset: false }).optional(),   // filter by StartDate <  to
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    order: z.enum(["created_desc", "start_desc", "start_asc"]).default("created_desc"),
});

function rowToRental(row: any) {
    // Keep exact field names matching your types
    return {
        rentalId: Number(row.RentalId),
        riderId: Number(row.RiderId),
        vehicleId: Number(row.VehicleId),
        planId: Number(row.PlanId),

        startDate: row.StartDate ? new Date(row.StartDate).toISOString() : null,
        expectedReturnDate: row.ExpectedReturnDate ? new Date(row.ExpectedReturnDate).toISOString() : null,
        actualReturnDate: row.ActualReturnDate ? new Date(row.ActualReturnDate).toISOString() : null,

        status: row.Status,

        ratePerDay: Number(row.RatePerDay ?? 0),
        deposit: Number(row.Deposit ?? 0),
        pricingJson: row.PricingJson ?? null,
        payableTotal: Number(row.PayableTotal ?? 0),
        paidTotal: Number(row.PaidTotal ?? 0),
        balanceDue: Number(
            row.BalanceDue ?? (Number(row.PayableTotal ?? 0) - Number(row.PaidTotal ?? 0))
        ),

        createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : null,
        updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : null,

        // labels for UI
        rider: { name: row.RiderName ?? null, phone: row.RiderPhone ?? null },
        vehicle: { code: row.VehicleCode ?? null, model: row.VehicleModel ?? null },
        plan: { name: row.PlanName ?? null },
    };
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const parsed = QuerySchema.parse({
            q: searchParams.get("q") ?? undefined,
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

        if (parsed.q) {
            // search in rider name/phone, vehicle code/model
            r.input("Q", sql.NVarChar(200), `%${parsed.q}%`);
            where.push(`
        (
          r.FullName LIKE @Q OR r.Phone LIKE @Q OR
          v.UniqueCode LIKE @Q OR v.Model LIKE @Q
        )
      `);
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

        r.FullName   AS RiderName,
        r.Phone      AS RiderPhone,
        v.UniqueCode AS VehicleCode,
        v.Model      AS VehicleModel,
        p.PlanName   AS PlanName
      FROM dbo.Rentals re
      LEFT JOIN dbo.Riders   r ON r.RiderId   = re.RiderId
      LEFT JOIN dbo.Vehicles v ON v.VehicleId = re.VehicleId
      LEFT JOIN dbo.Plans    p ON p.PlanId    = re.PlanId
      ${whereSql}
      ${orderBy}
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

      SELECT COUNT(1) AS Total
      FROM dbo.Rentals re
      LEFT JOIN dbo.Riders   r ON r.RiderId   = re.RiderId
      LEFT JOIN dbo.Vehicles v ON v.VehicleId = re.VehicleId
      LEFT JOIN dbo.Plans    p ON p.PlanId    = re.PlanId
      ${whereSql};
    `;

        // Ensure TS understands recordsets is an array
        const result = (await r.query<any>(query)) as unknown as sql.IResult<any>;
        const sets = result.recordsets as sql.IRecordSet<any>[];

        const list = (sets[0] ?? []).map(rowToRental);
        const total = sets[1]?.[0]?.Total ?? list.length;

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

/**
 * POST /api/v1/admin/rentals
 * Body:
 * {
 *   riderId: number,
 *   vehicleId: number,
 *   planId: number,
 *   startDate: string (ISO),
 *   expectedReturnDate: string (ISO),
 *   payment?: { amount?: number; method?: string; status?: string; txnRef?: string|null }
 * }
 */
const CreateSchema = z.object({
    riderId: z.coerce.number().int().positive(),
    vehicleId: z.coerce.number().int().positive(),
    planId: z.coerce.number().int().positive(),
    startDate: z.string().datetime({ offset: false }),
    expectedReturnDate: z.string().datetime({ offset: false }),
    payment: z.object({
        amount: z.coerce.number().nonnegative().default(0),
        method: z.string().trim().default("CASH"),
        status: z.string().trim().default("SUCCESS"),
        txnRef: z.string().trim().nullable().optional(),
    }).optional(),
    accessories: z.object({
        batteryIds: z.array(z.coerce.number().int().positive()).default([]),
        chargerIds: z.array(z.coerce.number().int().positive()).default([]),
        notes: z.string().trim().max(1000).optional(),
    }).optional(),
});


export async function POST(req: NextRequest) {
    let trx: sql.Transaction | null = null;

    try {
        const payload = await req.json();
        const data = CreateSchema.parse(payload);

        const pool = await getConnection();
        trx = new sql.Transaction(pool);
        await trx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        const tReq = () => new sql.Request(trx!);

        // 1) Verify entities + read pricing bits
        const vehQ = await tReq()
            .input("vid", sql.BigInt, data.vehicleId)
            .query(`
        SELECT VehicleId, Status, Quantity, RentPerDay
        FROM Vehicles WITH (UPDLOCK, ROWLOCK, HOLDLOCK)
        WHERE VehicleId=@vid;
      `);

        if (!vehQ.recordset.length) throw new Error("Vehicle not found");

        const veh = vehQ.recordset[0];
        const qty = Number(veh.Quantity ?? 0);
        const rentPerDay = Number(veh.RentPerDay ?? 0);
        if (qty <= 0) throw new Error("OUT_OF_STOCK");

        const planQ = await tReq()
            .input("pid", sql.Int, data.planId)
            .query(`
        SELECT PlanId, JoiningFee, SecurityDeposit
        FROM Plans WHERE PlanId=@pid;
      `);

        if (!planQ.recordset.length) throw new Error("Plan not found");
        const joining = Number(planQ.recordset[0].JoiningFee ?? 0);
        const deposit = Number(planQ.recordset[0].SecurityDeposit ?? 0);

        const riderQ = await tReq()
            .input("rid", sql.Int, data.riderId)
            .query(`SELECT RiderId FROM Riders WHERE RiderId=@rid;`);
        if (!riderQ.recordset.length) throw new Error("Rider not found");

        // 2) Compute totals
        const start = parseISO(data.startDate);
        const end = parseISO(data.expectedReturnDate);
        const days = Math.max(1, differenceInCalendarDays(end, start) + 1);
        const usage = days * rentPerDay;
        const payableTotal = joining + deposit + usage;

        const payAmount = Number(data.payment?.amount ?? 0);
        const paidTotal =
            data.payment && String(data.payment.status).toUpperCase() === "SUCCESS"
                ? payAmount
                : 0;

        // 3) Decrement quantity (atomic)
        {
            const upd = await tReq()
                .input("vid2", sql.BigInt, data.vehicleId)
                .query(`
          UPDATE Vehicles SET Quantity = Quantity - 1
          WHERE VehicleId=@vid2 AND Quantity > 0;
          SELECT @@ROWCOUNT AS rc;
        `);
            if ((upd.recordset[0]?.rc ?? 0) === 0) throw new Error("OUT_OF_STOCK");
        }

        // Optionally flip Status -> 'Rented' if quantity hits 0
        {
            const q2 = await tReq()
                .input("vid3", sql.BigInt, data.vehicleId)
                .query(`SELECT Quantity FROM Vehicles WHERE VehicleId=@vid3;`);
            const qLeft = Number(q2.recordset[0]?.Quantity ?? 0);
            if (qLeft <= 0) {
                await tReq()
                    .input("vid4", sql.BigInt, data.vehicleId)
                    .query(`UPDATE Vehicles SET Status='Rented' WHERE VehicleId=@vid4;`);
            }
        }

        // 4) Insert Rental (NO BalanceDue column)
        const pricingJson = JSON.stringify({ days, usage, rentPerDay, joining, deposit });

        const ins = await tReq()
            .input("rid", sql.Int, data.riderId)
            .input("vid", sql.BigInt, data.vehicleId)
            .input("pid", sql.Int, data.planId)
            .input("start", sql.DateTime2, data.startDate)
            .input("exp", sql.DateTime2, data.expectedReturnDate)
            .input("status", sql.VarChar(20), "ongoing")
            .input("rate", sql.Decimal(10, 2), rentPerDay)
            .input("dep", sql.Decimal(10, 2), deposit)
            .input("pricing", sql.NVarChar(sql.MAX), pricingJson)
            .input("payable", sql.Decimal(12, 2), payableTotal)
            .input("paid", sql.Decimal(12, 2), paidTotal)
            .query(`
        INSERT INTO Rentals
          (RiderId, VehicleId, PlanId, StartDate, ExpectedReturnDate, Status,
           RatePerDay, Deposit, PricingJson, PayableTotal, PaidTotal,
           CreatedAt, UpdatedAt)
        OUTPUT INSERTED.RentalId
        VALUES
          (@rid, @vid, @pid, @start, @exp, @status,
           @rate, @dep, @pricing, @payable, @paid,
           SYSUTCDATETIME(), SYSUTCDATETIME());
      `);

        const rentalId = Number(ins.recordset[0].RentalId);

        // 5) Optional first payment row
        if (data.payment && payAmount > 0) {
            await tReq()
                .input("rentalId", sql.BigInt, rentalId)
                .input("rid2", sql.Int, data.riderId)
                .input("amt", sql.Decimal(12, 2), payAmount)
                .input("method", sql.VarChar(20), (data.payment.method || "CASH").toUpperCase())
                .input("txn", sql.NVarChar(256), data.payment.txnRef ?? null)
                .input("pstatus", sql.VarChar(20), (data.payment.status || "SUCCESS").toUpperCase())
                .query(`
          INSERT INTO Payments
            (RentalId, RiderId, Amount, PaymentMethod, TxnRef, TransactionDate,
             TransactionStatus, CreatedAt, UpdatedAt)
          VALUES
            (@rentalId, @rid2, @amt, @method, @txn, SYSUTCDATETIME(),
             @pstatus, SYSUTCDATETIME(), SYSUTCDATETIME());
        `);

            // Reflect into Rental's PaidTotal only (BalanceDue is computed elsewhere)
            await tReq()
                .input("rentalId2", sql.BigInt, rentalId)
                .query(`
          UPDATE r
          SET
            PaidTotal = (
              SELECT COALESCE(SUM(Amount),0)
              FROM Payments
              WHERE RentalId=r.RentalId AND TransactionStatus='SUCCESS'
            ),
            UpdatedAt = SYSUTCDATETIME()
          FROM Rentals r
          WHERE r.RentalId=@rentalId2;
        `);
        }

        if (data.accessories) {
            const ids = [...(data.accessories.batteryIds || []), ...(data.accessories.chargerIds || [])];
            for (const id of ids) {
                await tReq()
                    .input("ItemId", sql.BigInt, id)
                    .input("RentalId", sql.BigInt, rentalId)
                    .input("Notes", sql.NVarChar(1000), data.accessories.notes ?? null)
                    .query(`
        UPDATE dbo.MiscInventory
        SET AssignedRentalId=@RentalId,
            Status='Assigned',
            Notes = COALESCE(@Notes, Notes),
            UpdatedAt=SYSUTCDATETIME()
        WHERE ItemId=@ItemId
          AND (AssignedRentalId IS NULL)
          AND Status='Available';
      `);
            }
        }

        await trx.commit();
        trx = null;

        return NextResponse.json({
            ok: true,
            data: { rentalId },
            message: "Rental created successfully",
        });
    } catch (err: any) {
        try {
            if (trx && (trx as any)._aborted !== true) await trx.rollback();
        } catch {}
        console.error("POST /admin/rentals create error:", err);
        const msg = err?.message === "OUT_OF_STOCK" ? "Selected vehicle is out of stock." : err?.message || "Create rental failed";
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
}
