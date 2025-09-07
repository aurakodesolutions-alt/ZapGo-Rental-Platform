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

        if (action !== "return") {
            return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 });
        }

        const pool = await getConnection();
        trx = new sql.Transaction(pool);
        await trx.begin();

        // read rental to get vehicleId
        const pre = await new sql.Request(trx)
            .input("RentalId", sql.BigInt, rentalId)
            .query(`SELECT RentalId, VehicleId, Status FROM dbo.Rentals WHERE RentalId = @RentalId;`);

        const row = pre.recordset?.[0];
        if (!row) {
            await trx.rollback(); trx = null;
            return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        }
        if (String(row.Status).toLowerCase() === "completed") {
            await trx.rollback(); trx = null;
            return NextResponse.json({ ok: false, error: "Rental already completed" }, { status: 409 });
        }

        // update rental to completed + set actual return
        await new sql.Request(trx)
            .input("RentalId", sql.BigInt, rentalId)
            .query(`
        UPDATE dbo.Rentals
        SET Status = 'completed', ActualReturnDate = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
        WHERE RentalId = @RentalId;
      `);

        // mark vehicle available
        await new sql.Request(trx)
            .input("VehicleId", sql.BigInt, row.VehicleId)
            .query(`
        UPDATE dbo.Vehicles
        SET Status = 'Available', UpdatedAt = SYSUTCDATETIME()
        WHERE VehicleId = @VehicleId;
      `);

        await trx.commit(); trx = null;

        // return fresh record
        const fresh = await getConnection();
        const r = new sql.Request(fresh).input("RentalId", sql.BigInt, rentalId);
        const result = (await r.query<any>(`
      SELECT
        re.RentalId, re.RiderId, re.VehicleId, re.PlanId,
        re.StartDate, re.ExpectedReturnDate, re.ActualReturnDate,
        re.Status, re.RatePerDay, re.Deposit, re.PricingJson,
        re.PayableTotal, re.PaidTotal, re.BalanceDue,
        re.CreatedAt, re.UpdatedAt,
        r.FullName AS RiderName, r.Phone AS RiderPhone,
        v.UniqueCode AS VehicleCode, v.Model AS VehicleModel,
        p.PlanName AS PlanName
      FROM dbo.Rentals re
      LEFT JOIN dbo.Riders   r ON r.RiderId   = re.RiderId
      LEFT JOIN dbo.Vehicles v ON v.VehicleId = re.VehicleId
      LEFT JOIN dbo.Plans    p ON p.PlanId    = re.PlanId
      WHERE re.RentalId = @RentalId;
    `)) as unknown as sql.IResult<any>;

        const rentalRow = (result.recordsets as sql.IRecordSet<any>[])[0]?.[0];
        return NextResponse.json({ ok: true, data: rowToRental(rentalRow) });
    } catch (err) {
        try { if (trx && (trx as any)._aborted !== true) await trx.rollback(); } catch {}
        console.error("PATCH /admin/rentals/[id] error:", err);
        return NextResponse.json({ ok: false, error: "Failed to update rental" }, { status: 500 });
    }
}
