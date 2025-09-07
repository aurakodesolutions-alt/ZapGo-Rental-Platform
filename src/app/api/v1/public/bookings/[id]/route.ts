import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeImages(raw?: string | null): string[] {
    if (!raw) return [];
    // handle JSON array string or comma-separated list
    try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr.map((s) => String(s));
    } catch { /* not JSON */ }
    return String(raw)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

export async function GET(
    _req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const rentalId = Number((await (props.params)).id);
    if (!rentalId) {
        return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
    }

    const pool = await getConnection();
    const r = await pool
        .request()
        .input("id", sql.BigInt, rentalId)
        .query(`
      SELECT
        r.RentalId, r.Status, r.StartDate, r.ExpectedReturnDate, r.ActualReturnDate,
        r.PayableTotal, r.PaidTotal, r.BalanceDue, r.CreatedAt, r.UpdatedAt,
        v.VehicleId, v.Model, v.VehicleImagesURLs, v.RentPerDay,
        p.PlanId, p.PlanName, p.JoiningFee, p.SecurityDeposit,
        d.RiderId, d.FullName, d.Email, d.Phone
      FROM Rentals r
      JOIN Vehicles v ON v.VehicleId = r.VehicleId
      JOIN Plans    p ON p.PlanId    = r.PlanId
      JOIN Riders   d ON d.RiderId   = r.RiderId
      WHERE r.RentalId = @id
    `);

    if (!r.recordset.length) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const x = r.recordset[0];

    return NextResponse.json({
        rentalId: x.RentalId,
        status: x.Status,
        startDate: x.StartDate,
        endDate: x.ExpectedReturnDate,
        payableTotal: Number(x.PayableTotal || 0),
        paidTotal: Number(x.PaidTotal || 0),
        balanceDue: Number(x.BalanceDue || 0),
        createdAt: x.CreatedAt,
        vehicle: {
            id: x.VehicleId,
            model: x.Model,
            images: normalizeImages(x.VehicleImagesURLs),
            rentPerDay: Number(x.RentPerDay || 0),
        },
        plan: {
            id: x.PlanId,
            name: x.PlanName,
            joiningFee: Number(x.JoiningFee || 0),
            securityDeposit: Number(x.SecurityDeposit || 0),
        },
        rider: {
            id: x.RiderId,
            name: x.FullName,
            email: x.Email,
            phone: x.Phone,
        },
    });
}
