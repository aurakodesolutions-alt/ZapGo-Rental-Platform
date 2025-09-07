import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Payload = z.object({
    recoveryType: z.string().trim().optional(),
    odometerEnd: z.coerce.number().nonnegative().default(0),
    chargePercent: z.coerce.number().min(0).max(100).default(100),
    accessoriesReturned: z.record(z.any()).default({}),
    isBatteryMissing: z.boolean().default(false),

    missingItemsCharge: z.coerce.number().default(0),
    cleaningFee: z.coerce.number().default(0),
    damageFee: z.coerce.number().default(0),
    otherAdjustments: z.coerce.number().default(0),

    taxPercent: z.coerce.number().default(18),

    // derived fields may be posted back by UI, but we’ll re-save whatever arrives
    lateDays: z.coerce.number().default(0),
    lateFee: z.coerce.number().default(0),
    subtotal: z.coerce.number().default(0),
    taxAmount: z.coerce.number().default(0),
    totalDue: z.coerce.number().default(0),
    depositHeld: z.coerce.number().default(0),
    depositReturn: z.coerce.number().default(0),
    finalAmount: z.coerce.number().default(0),

    remarks: z.string().trim().optional(),
});

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ rentalId: string }> }
) {
    let trx: sql.Transaction | null = null;
    try {
        const rentalId = Number((await props.params).rentalId);
        if (!Number.isFinite(rentalId)) {
            return NextResponse.json({ ok: false, error: "Invalid rental id" }, { status: 400 });
        }

        const body = Payload.parse(await req.json());

        const pool = await getConnection();
        trx = new sql.Transaction(pool);
        await trx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        const t = () => new sql.Request(trx!);

        // Ensure rental exists
        const chk = await t().input("rid", sql.BigInt, rentalId).query(`
      SELECT r.RentalId, r.RiderId, r.VehicleId, r.ExpectedReturnDate, r.Status
      FROM Rentals r
      WHERE r.RentalId = @rid;
    `);
        if (!chk.recordset.length) throw new Error("Rental not found");
        const R = chk.recordset[0];

        // Upsert inspection keyed by RentalId
        const accessoriesJson = JSON.stringify(body.accessoriesReturned || {});
        const res = await t()
            .input("rid", sql.BigInt, rentalId)
            .input("riderId", sql.Int, R.RiderId)
            .input("vehicleId", sql.BigInt, R.VehicleId)
            .input("recoveryType", sql.VarChar(10), body.recoveryType ?? null)
            .input("odo", sql.Int, body.odometerEnd)
            .input("charge", sql.Int, body.chargePercent)
            .input("acc", sql.NVarChar(sql.MAX), accessoriesJson)
            .input("bat", sql.Bit, body.isBatteryMissing ? 1 : 0)
            .input("miss", sql.Decimal(12,2), body.missingItemsCharge)
            .input("clean", sql.Decimal(12,2), body.cleaningFee)
            .input("dmg", sql.Decimal(12,2), body.damageFee)
            .input("other", sql.Decimal(12,2), body.otherAdjustments)
            .input("lateDays", sql.Int, body.lateDays)
            .input("lateFee", sql.Decimal(12,2), body.lateFee)
            .input("taxPct", sql.Decimal(5,2), body.taxPercent)
            .input("sub", sql.Decimal(12,2), body.subtotal)
            .input("taxAmt", sql.Decimal(12,2), body.taxAmount)
            .input("tot", sql.Decimal(12,2), body.totalDue)
            .input("depHeld", sql.Decimal(12,2), body.depositHeld)
            .input("depRet", sql.Decimal(12,2), body.depositReturn)
            .input("finalAmt", sql.Decimal(12,2), body.finalAmount)
            .input("remarks", sql.NVarChar(1000), body.remarks ?? null)
            .query(`
        MERGE ReturnInspections AS t
        USING (SELECT @rid AS RentalId) AS s
          ON t.RentalId = s.RentalId
        WHEN MATCHED THEN
          UPDATE SET
            RiderId=@riderId, VehicleId=@vehicleId, RecoveryType=@recoveryType,
            OdometerEnd=@odo, ChargePercent=@charge, AccessoriesReturned=@acc,
            IsBatteryMissing=@bat, MissingItemsCharge=@miss, CleaningFee=@clean,
            DamageFee=@dmg, OtherAdjustments=@other, LateDays=@lateDays, LateFee=@lateFee,
            TaxPercent=@taxPct, Subtotal=@sub, TaxAmount=@taxAmt, TotalDue=@tot,
            DepositHeld=@depHeld, DepositReturn=@depRet, FinalAmount=@finalAmt,
            Remarks=@remarks, UpdatedAt=SYSUTCDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (RentalId, RiderId, VehicleId, RecoveryType, OdometerEnd, ChargePercent, AccessoriesReturned,
                  IsBatteryMissing, MissingItemsCharge, CleaningFee, DamageFee, OtherAdjustments,
                  LateDays, LateFee, TaxPercent, Subtotal, TaxAmount, TotalDue,
                  DepositHeld, DepositReturn, FinalAmount, Remarks, Settled, CreatedAt, UpdatedAt)
          VALUES (@rid, @riderId, @vehicleId, @recoveryType, @odo, @charge, @acc,
                  @bat, @miss, @clean, @dmg, @other,
                  @lateDays, @lateFee, @taxPct, @sub, @taxAmt, @tot,
                  @depHeld, @depRet, @finalAmt, @remarks, 0, SYSUTCDATETIME(), SYSUTCDATETIME())
        OUTPUT INSERTED.ReturnInspectionId AS id;
      `);

        await trx.commit();
        trx = null;

        return NextResponse.json({ ok: true, data: { returnInspectionId: Number(res.recordset[0].id) } });
    } catch (err: any) {
        try { if (trx && (trx as any)._aborted !== true) await trx.rollback(); } catch {}
        console.error("POST /admin/returns/:id/inspection error:", err);
        return NextResponse.json({ ok: false, error: err?.message || "Failed to save inspection" }, { status: 400 });
    }
}
