import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest) {
    try {
        const pool = await getConnection();
        const r = await pool.request().query(`
      SELECT TOP 500 VehicleId, UniqueCode, Model
      FROM dbo.Vehicles
      ORDER BY CreatedAt DESC, VehicleId DESC
    `);
        const data = r.recordset.map((v:any) => ({
            vehicleId: Number(v.VehicleId),
            uniqueCode: v.UniqueCode,
            model: v.Model
        }));
        return NextResponse.json({ ok: true, data });
    } catch (err) {
        console.error("GET /vehicles/minimal error:", err);
        return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
    }
}
