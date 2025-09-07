import { NextRequest, NextResponse } from "next/server";
import { getRiderIdFromRequest } from "@/lib/auth/auth-rider";
import { getConnection, sql } from "@/lib/db";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const rid = await getRiderIdFromRequest(req);
    if (!rid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rentalId = Number((await (props.params)).id);
    if (!rentalId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const pool = await getConnection();
    const r = await pool.request()
        .input("rid", sql.Int, rid)
        .input("id", sql.BigInt, rentalId)
        .query(`
      SELECT TOP 1 r.*, v.Model, v.VehicleImagesURLs, p.PlanName, p.JoiningFee, p.SecurityDeposit
      FROM Rentals r
      JOIN Vehicles v ON v.VehicleId=r.VehicleId
      JOIN Plans p ON p.PlanId=r.PlanId
      WHERE r.RentalId=@id AND r.RiderId=@rid
    `);

    if (!r.recordset.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const x = r.recordset[0];
    const normalize = (raw?: string) => {
        if (!raw) return [];
        try { const a = JSON.parse(raw); if (Array.isArray(a)) return a; } catch {}
        return raw.split(",").map((s: string) => s.trim()).filter(Boolean);
    };
    return NextResponse.json({
        rentalId: x.RentalId,
        status: x.Status,
        startDate: x.StartDate,
        endDate: x.ExpectedReturnDate,
        payableTotal: Number(x.PayableTotal || 0),
        paidTotal: Number(x.PaidTotal || 0),
        balanceDue: Number(x.BalanceDue || 0),
        vehicle: { id: x.VehicleId, model: x.Model, images: normalize(x.VehicleImagesURLs) },
        plan: { id: x.PlanId, name: x.PlanName, joiningFee: Number(x.JoiningFee||0), securityDeposit: Number(x.SecurityDeposit||0) },
    });
}
