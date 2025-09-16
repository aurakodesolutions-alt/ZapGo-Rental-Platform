import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IdSchema = z.coerce.number().int().positive();

function rowToRental(row: any) {
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
        balanceDue: Number(row.BalanceDue ?? (Number(row.PayableTotal ?? 0) - Number(row.PaidTotal ?? 0))),

        createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : null,
        updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : null,

        rider: { name: row.RiderName ?? null, phone: row.RiderPhone ?? null },
        vehicle: { code: row.VehicleCode ?? null, model: row.VehicleModel ?? null },
        plan: { name: row.PlanName ?? null },
    };
}

function rowToPayment(row: any) {
    return {
        paymentId: Number(row.PaymentId),
        rentalId: Number(row.RentalId),
        riderId: Number(row.RiderId),
        amount: Number(row.Amount ?? 0),
        method: row.PaymentMethod ?? null,
        txnRef: row.TxnRef ?? null,
        transactionStatus: row.TransactionStatus ?? null,
        transactionDate: row.TransactionDate ? new Date(row.TransactionDate).toISOString() : null,
        createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : null,
    };
}

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const rentalId = Number((await props.params).id);
        const pool = await getConnection();

        const r = new sql.Request(pool).input("RentalId", sql.BigInt, rentalId);

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
      WHERE re.RentalId = @RentalId;

      SELECT
        pay.PaymentId, pay.RentalId, pay.RiderId, pay.Amount,
        pay.PaymentMethod, pay.TxnRef, pay.TransactionStatus,
        pay.TransactionDate, pay.CreatedAt
      FROM dbo.Payments pay
      WHERE pay.RentalId = @RentalId
      ORDER BY pay.TransactionDate DESC, pay.PaymentId DESC;
    `;

        const result = (await r.query<any>(query)) as unknown as sql.IResult<any>;
        const sets = result.recordsets as sql.IRecordSet<any>[];

        const rentalRow = sets[0]?.[0];
        if (!rentalRow) {
            return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        }

        const rental = rowToRental(rentalRow);
        const payments = (sets[1] ?? []).map(rowToPayment);

        return NextResponse.json({ ok: true, data: { rental, payments } });
    } catch (err) {
        console.error("GET /admin/rentals/[id] error:", err);
        return NextResponse.json({ ok: false, error: "Failed to fetch rental" }, { status: 500 });
    }
}

/**
 * PATCH body: { action: "return" }
 * Marks rental as returned and sets vehicle to Available.
 */
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    let trx: sql.Transaction | null = null;

    try {
        const rentalId = Number((await props.params).id);
        const body = await req.json().catch(() => ({} as any));
        const action = String(body?.action || "");

        const pool = await getConnection();
        trx = new sql.Transaction(pool);
        await trx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

        const t = () => new sql.Request(trx!);

        // Load rental row with lock
        const pre = await t()
            .input("RentalId", sql.BigInt, rentalId)
            .query(`
                SELECT RentalId, RiderId, VehicleId, Status, PayableTotal, PaidTotal
                FROM dbo.Rentals WITH (UPDLOCK, ROWLOCK, HOLDLOCK)
                WHERE RentalId = @RentalId;
            `);

        const row = pre.recordset?.[0];
        if (!row) {
            await trx.rollback(); trx = null;
            return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        }

        if (action === "return") {
            if (String(row.Status).toLowerCase() === "completed") {
                await trx.rollback(); trx = null;
                return NextResponse.json({ ok: false, error: "Rental already completed" }, { status: 409 });
            }

            await t()
                .input("RentalId", sql.BigInt, rentalId)
                .query(`
          UPDATE dbo.Rentals
          SET Status='completed',
              ActualReturnDate = SYSUTCDATETIME(),
              UpdatedAt = SYSUTCDATETIME()
          WHERE RentalId=@RentalId;
        `);

            // Mark vehicle available
            await t()
                .input("VehicleId", sql.BigInt, row.VehicleId)
                .query(`
          UPDATE dbo.Vehicles
          SET Status='Available', UpdatedAt=SYSUTCDATETIME()
          WHERE VehicleId=@VehicleId;
        `);

            await trx.commit(); trx = null;
            // Return fresh
            const fresh = await getConnection();
            const rs = await new sql.Request(fresh)
                .input("RentalId", sql.BigInt, rentalId)
                .query(`
          SELECT re.*, r.FullName AS RiderName, r.Phone AS RiderPhone,
                 v.UniqueCode AS VehicleCode, v.Model AS VehicleModel,
                 p.PlanName AS PlanName
          FROM dbo.Rentals re
          LEFT JOIN dbo.Riders r   ON r.RiderId=re.RiderId
          LEFT JOIN dbo.Vehicles v ON v.VehicleId=re.VehicleId
          LEFT JOIN dbo.Plans p    ON p.PlanId=re.PlanId
          WHERE re.RentalId=@RentalId;
        `);

            return NextResponse.json({ ok: true, data: rowToRental(rs.recordset[0]) });
        }

        if (action === "start") {
            // Only allowed from confirmed -> ongoing
            if (String(row.Status).toLowerCase() !== "confirmed") {
                await trx.rollback(); trx = null;
                return NextResponse.json({ ok: false, error: "Only confirmed rentals can be started" }, { status: 409 });
            }

            // Validate payment (required for start)
            const pay = body?.payment || {};
            const amount = Number(pay?.amount ?? 0);
            const method = String(pay?.method || "").toUpperCase();
            const txnRef  = (pay?.txnRef ?? null) as string | null;

            if (!(method === "CASH" || method === "UPI")) {
                await trx.rollback(); trx = null;
                return NextResponse.json({ ok: false, error: "Payment method must be CASH or UPI" }, { status: 400 });
            }
            if (!(amount > 0)) {
                await trx.rollback(); trx = null;
                return NextResponse.json({ ok: false, error: "Payment amount is required to start" }, { status: 400 });
            }

            // 1) Insert payment (SUCCESS)
            await t()
                .input("rentalId", sql.BigInt, rentalId)
                .input("rid", sql.Int, row.RiderId)
                .input("amt", sql.Decimal(12,2), amount)
                .input("method", sql.VarChar(20), method)
                .input("txn", sql.NVarChar(256), txnRef)
                .input("status", sql.VarChar(20), "SUCCESS")
                .query(`
          INSERT INTO dbo.Payments
            (RentalId, RiderId, Amount, PaymentMethod, TxnRef, TransactionDate, TransactionStatus, CreatedAt, UpdatedAt)
          VALUES
            (@rentalId, @rid, @amt, @method, @txn, SYSUTCDATETIME(), @status, SYSUTCDATETIME(), SYSUTCDATETIME());
        `);

            // 2) Recompute PaidTotal on rental
            await t()
                .input("rentalId", sql.BigInt, rentalId)
                .query(`
          UPDATE r
          SET PaidTotal = (
                SELECT COALESCE(SUM(Amount),0)
                FROM dbo.Payments
                WHERE RentalId=r.RentalId AND TransactionStatus='SUCCESS'
              ),
              UpdatedAt = SYSUTCDATETIME()
          FROM dbo.Rentals r
          WHERE r.RentalId=@rentalId;
        `);

            // 3) Assign accessories if provided
            if (body?.accessories) {
                const ids: number[] = [
                    ...((body.accessories.batteryIds as number[]) ?? []),
                    ...((body.accessories.chargerIds as number[]) ?? []),
                ];
                const notes = (body.accessories.notes ?? null) as string | null;

                for (const id of ids) {
                    await t()
                        .input("ItemId", sql.BigInt, id)
                        .input("RentalId", sql.BigInt, rentalId)
                        .input("Notes", sql.NVarChar(1000), notes)
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

            // 4) Flip rental to ongoing; if vehicle stock model requires, you may set vehicle status depending on qty
            await t()
                .input("rentalId", sql.BigInt, rentalId)
                .query(`
          UPDATE dbo.Rentals
          SET Status='ongoing', UpdatedAt=SYSUTCDATETIME()
          WHERE RentalId=@rentalId;
        `);

            await trx.commit(); trx = null;

            // Return fresh rental + payments list
            // Return fresh rental + payments list
            const conn = await getConnection();
            const R = new sql.Request(conn).input("RentalId", sql.BigInt, rentalId);

            const res = await R.query(`
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
                WHERE re.RentalId = @RentalId;

                SELECT PaymentId, RentalId, RiderId, Amount, PaymentMethod, TxnRef,
                       TransactionStatus, TransactionDate, CreatedAt
                FROM dbo.Payments
                WHERE RentalId=@RentalId
                ORDER BY TransactionDate DESC, PaymentId DESC;
            `);

// ✅ Work with `recordsets` (not `recordset`)
            const rec = res as unknown as sql.IResult<any>;
            const sets = rec.recordsets as sql.IRecordSet<any>[];

            const rentalRow = sets?.[0]?.[0];
            if (!rentalRow) {
                return NextResponse.json({ ok: false, error: "Rental fetch failed post-update" }, { status: 500 });
            }

            const rental = rowToRental(rentalRow);
            const payments = (sets?.[1] ?? []).map(rowToPayment);

            return NextResponse.json({ ok: true, data: { rental, payments } });

        }

        await trx.rollback(); trx = null;
        return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 });
    } catch (err) {
        try { if (trx && (trx as any)._aborted !== true) await trx.rollback(); } catch {}
        console.error("PATCH /admin/rentals/[id] error:", err);
        return NextResponse.json({ ok: false, error: "Failed to update rental" }, { status: 500 });
    }
}
