import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
    _req: NextRequest,
    props: { params: Promise<{ rentalId: string }> }
) {
    try {
        const rentalId = Number((await props.params).rentalId);
        if (!Number.isFinite(rentalId)) {
            return NextResponse.json({ ok: false, error: "Invalid rental id" }, { status: 400 });
        }

        const pool = await getConnection();
        const r1 = await new sql.Request(pool)
            .input("rid", sql.BigInt, rentalId)
            .query(`
        SELECT
          r.RentalId, r.RiderId, ri.FullName, ri.Phone, ri.Email,
          r.VehicleId, v.UniqueCode, v.Model,
          r.PlanId, p.PlanName,
          r.StartDate, r.ExpectedReturnDate, r.ActualReturnDate,
          r.Status,
          r.RatePerDay, r.Deposit,
          r.PayableTotal, r.PaidTotal
        FROM Rentals r
        JOIN Riders  ri ON ri.RiderId = r.RiderId
        JOIN Vehicles v ON v.VehicleId = r.VehicleId
        LEFT JOIN Plans p ON p.PlanId = r.PlanId
        WHERE r.RentalId = @rid;
      `);

        if (!r1.recordset.length) {
            return NextResponse.json({ ok: false, error: "Rental not found" }, { status: 404 });
        }

        const R = r1.recordset[0];
        const rental = {
            rentalId: Number(R.RentalId),
            rider: { riderId: Number(R.RiderId), fullName: R.FullName, phone: R.Phone, email: R.Email },
            vehicle: { vehicleId: Number(R.VehicleId), uniqueCode: R.UniqueCode, model: R.Model },
            plan: { planId: Number(R.PlanId), planName: R.PlanName },
            startDate: R.StartDate,
            expectedReturnDate: R.ExpectedReturnDate,
            actualReturnDate: R.ActualReturnDate,
            status: String(R.Status),
            ratePerDay: Number(R.RatePerDay),
            deposit: Number(R.Deposit),
            payableTotal: Number(R.PayableTotal),
            paidTotal: Number(R.PaidTotal),
            balanceDue: Number(R.PayableTotal) - Number(R.PaidTotal),
        };

        const r2 = await new sql.Request(pool)
            .input("rid", sql.BigInt, rentalId)
            .query(`
        SELECT TOP 1 *
        FROM ReturnInspections
        WHERE RentalId = @rid
        ORDER BY ReturnInspectionId DESC;
      `);

        const I = r2.recordset[0];
        const inspection = I
            ? {
                returnInspectionId: Number(I.ReturnInspectionId),
                rentalId: Number(I.RentalId),
                riderId: Number(I.RiderId),
                vehicleId: Number(I.VehicleId),
                recoveryType: I.RecoveryType ?? null,
                odometerEnd: I.OdometerEnd ?? 0,
                chargePercent: I.ChargePercent ?? 0,
                accessoriesReturned: I.AccessoriesReturned ? JSON.parse(I.AccessoriesReturned) : {},
                isBatteryMissing: Boolean(I.IsBatteryMissing),
                missingItemsCharge: Number(I.MissingItemsCharge ?? 0),
                lateDays: Number(I.LateDays ?? 0),
                lateFee: Number(I.LateFee ?? 0),
                cleaningFee: Number(I.CleaningFee ?? 0),
                damageFee: Number(I.DamageFee ?? 0),
                otherAdjustments: Number(I.OtherAdjustments ?? 0),
                taxPercent: Number(I.TaxPercent ?? 0),
                subtotal: Number(I.Subtotal ?? 0),
                taxAmount: Number(I.TaxAmount ?? 0),
                totalDue: Number(I.TotalDue ?? 0),
                depositHeld: Number(I.DepositHeld ?? 0),
                depositReturn: Number(I.DepositReturn ?? 0),
                finalAmount: Number(I.FinalAmount ?? 0),
                remarks: I.Remarks ?? "",
                settled: Boolean(I.Settled),
                settledAt: I.SettledAt ?? null,
                nocIssued: Boolean(I.NocIssued),
                nocId: I.NocId ?? null,
                createdAt: I.CreatedAt,
                updatedAt: I.UpdatedAt,
            }
            : null;

        // simple in-app “settings” so UI can render; adjust if you later add a Settings table
        const settings = {
            companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || "ZapGo Rentals Pvt. Ltd.",
            lateFeeEnabled: true,
            lateFeePerDay: 50,          // tune as you like
            taxPercentDefault: 18,      // tune as you like
        };

        return NextResponse.json({ ok: true, data: { rental, inspection, settings } });
    } catch (err: any) {
        console.error("GET /admin/returns/:id error:", err);
        return NextResponse.json({ ok: false, error: "Failed to load return" }, { status: 400 });
    }
}
