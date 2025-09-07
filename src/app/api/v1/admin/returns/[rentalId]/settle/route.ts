import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
    // optional payment to close any remaining amount
    payment: z.object({
        amount: z.coerce.number().positive(),
        method: z.string().trim().default("CASH"),
        txnRef: z.string().trim().nullable().optional(),
    }).optional(),
    issueNoc: z.boolean().default(false),
});

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ rentalId: string }> }
) {
    let trx: sql.Transaction | null = null;
    try {
        const rentalId = Number((await props.params).rentalId);
        const body = Body.parse(await req.json().catch(() => ({})));

        const pool = await getConnection();
        trx = new sql.Transaction(pool);
        await trx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        const t = () => new sql.Request(trx!);

        // load rental + inspection
        const r1 = await t().input("rid", sql.BigInt, rentalId).query(`
      SELECT r.RentalId, r.RiderId, r.VehicleId, r.Status, r.PayableTotal, r.PaidTotal
      FROM Rentals r WHERE r.RentalId=@rid;
    `);
        if (!r1.recordset.length) throw new Error("Rental not found");
        const R = r1.recordset[0];

        const r2 = await t().input("rid", sql.BigInt, rentalId).query(`
      SELECT TOP 1 *
      FROM ReturnInspections WHERE RentalId=@rid ORDER BY ReturnInspectionId DESC;
    `);
        if (!r2.recordset.length) throw new Error("Save inspection draft first");
        const I = r2.recordset[0];

        const currentBalance = Number(R.PayableTotal) - Number(R.PaidTotal);
        const finalAmount = Number(I.FinalAmount ?? 0); // this should already include previous balance + charges

        // If a payment is sent, record it now
        if (body.payment) {
            await t()
                .input("rid", sql.BigInt, rentalId)
                .input("rider", sql.Int, R.RiderId)
                .input("amt", sql.Decimal(12,2), body.payment.amount)
                .input("method", sql.VarChar(20), (body.payment.method || "CASH").toUpperCase())
                .input("txn", sql.NVarChar(256), body.payment.txnRef ?? null)
                .query(`
          INSERT INTO Payments
            (RentalId, RiderId, Amount, PaymentMethod, TxnRef, TransactionDate, TransactionStatus, CreatedAt, UpdatedAt)
          VALUES
            (@rid, @rider, @amt, @method, @txn, SYSUTCDATETIME(), 'SUCCESS', SYSUTCDATETIME(), SYSUTCDATETIME());
        `);

            // reflect into rental totals
            await t().input("rid", sql.BigInt, rentalId).query(`
        UPDATE r
        SET PaidTotal = (SELECT COALESCE(SUM(Amount),0)
                         FROM Payments WHERE RentalId=r.RentalId AND TransactionStatus='SUCCESS'),
            UpdatedAt = SYSUTCDATETIME()
        FROM Rentals r WHERE r.RentalId=@rid;
      `);
        }

        // recompute remaining due after optional payment
        const r3 = await t().input("rid", sql.BigInt, rentalId).query(`
      SELECT PayableTotal, PaidTotal FROM Rentals WHERE RentalId=@rid;
    `);
        const dueNow = Number(r3.recordset[0].PayableTotal) - Number(r3.recordset[0].PaidTotal) + Number(I.Subtotal ?? 0) + Number(I.TaxAmount ?? 0);

        if (dueNow > 0.0001) {
            throw new Error("Outstanding amount remains. Collect payment before settling.");
        }

        // close rental
        await t().input("rid", sql.BigInt, rentalId).query(`
      UPDATE Rentals
      SET Status='completed', ActualReturnDate=SYSUTCDATETIME(), UpdatedAt=SYSUTCDATETIME()
      WHERE RentalId=@rid;
    `);

        // increment vehicle stock and set Available if > 0
        await t().input("vid", sql.BigInt, R.VehicleId).query(`
      UPDATE Vehicles SET Quantity = Quantity + 1 WHERE VehicleId=@vid;
      IF (SELECT Quantity FROM Vehicles WHERE VehicleId=@vid) > 0
        UPDATE Vehicles SET Status='Available' WHERE VehicleId=@vid;
    `);

        // mark inspection settled (+ optional NOC)
        await t()
            .input("rid", sql.BigInt, rentalId)
            .input("noc", sql.Bit, body.issueNoc ? 1 : 0)
            .input("nocId", sql.NVarChar(64), body.issueNoc ? `NOC-${Date.now()}` : null)
            .query(`
        UPDATE ReturnInspections
        SET Settled=1,
            SettledAt=SYSUTCDATETIME(),
            NocIssued=@noc,
            NocId = CASE WHEN @noc=1 THEN @nocId ELSE NocId END,
            UpdatedAt=SYSUTCDATETIME()
        WHERE RentalId=@rid;
      `);

        await trx.commit();
        trx = null;

        return NextResponse.json({ ok: true, message: "Return settled" });
    } catch (err: any) {
        try { if (trx && (trx as any)._aborted !== true) await trx.rollback(); } catch {}
        console.error("POST /admin/returns/:id/settle error:", err);
        return NextResponse.json({ ok: false, error: err?.message || "Failed to settle return" }, { status: 400 });
    }
}
