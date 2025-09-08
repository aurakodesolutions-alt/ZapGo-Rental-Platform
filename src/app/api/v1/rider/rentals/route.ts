import { NextRequest, NextResponse } from "next/server";
import { getRiderIdFromRequest } from "@/lib/auth/auth-rider";
import { getConnection, sql } from "@/lib/db";

export async function GET(req: NextRequest) {
    const rid = await getRiderIdFromRequest(req);
    if (!rid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = new URL(req.url).searchParams.get("status"); // optional

    const pool = await getConnection();
    const r = await pool.request()
        .input("rid", sql.Int, rid)
        .query(`
      SELECT r.RentalId, r.Status, r.StartDate, r.ExpectedReturnDate, r.ActualReturnDate,
             r.PayableTotal, r.PaidTotal, r.BalanceDue, r.CreatedAt,
             v.VehicleId, v.Model, v.VehicleImagesURLs, v.RentPerDay
             p.PlanId, p.PlanName
      FROM Rentals r
      JOIN Vehicles v ON v.VehicleId=r.VehicleId
      JOIN Plans p ON p.PlanId=r.PlanId
      WHERE r.RiderId=@rid
      ORDER BY r.RentalId DESC
    `);

    const rows = r.recordset.filter(x => !status || String(x.Status).toUpperCase() === status.toUpperCase());
    const normalize = (raw?: string) => {
        if (!raw) return [];
        try { const a = JSON.parse(raw); if (Array.isArray(a)) return a; } catch {}
        return raw.split(",").map(s => s.trim()).filter(Boolean);
    };

    return NextResponse.json(rows.map(x => ({
        rentalId: x.RentalId,
        status: x.Status,
        startDate: x.StartDate,
        endDate: x.ExpectedReturnDate,
        payableTotal: Number(x.PayableTotal || 0),
        paidTotal: Number(x.PaidTotal || 0),
        balanceDue: Number(x.BalanceDue || 0),
        vehicle: { id: x.VehicleId, model: x.Model, images: normalize(x.VehicleImagesURLs), rentPerDay: x.RentPerDay },
        plan: { id: x.PlanId, name: x.PlanName },
    })));
}
