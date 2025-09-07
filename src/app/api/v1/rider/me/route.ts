import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";
import { getRiderIdFromRequest } from "@/lib/auth/auth-rider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const rid = await getRiderIdFromRequest(req);
    if (!rid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pool = await getConnection();
    const [info, kyc, counts] = await Promise.all([
        pool.request().input("rid", sql.Int, rid).query(`
      SELECT RiderId, FullName, Email, Phone, CreatedAtUtc, LastLoginAtUtc
      FROM Riders WHERE RiderId=@rid
    `),
        pool.request().input("rid", sql.Int, rid).query(`
      SELECT AadhaarNumber, PanNumber, DrivingLicenseNumber,
             AadhaarImageUrl, PanCardImageUrl, DrivingLicenseImageUrl, KycCreatedAtUtc
      FROM RiderKyc WHERE RiderId=@rid
    `),
        pool.request().input("rid", sql.Int, rid).query(`
      SELECT
        SUM(CASE WHEN Status IN ('CONFIRMED','ONGOING') THEN 1 ELSE 0 END) AS activeCount,
        COUNT(1) AS totalCount
      FROM Rentals WHERE RiderId=@rid
    `)
    ]);

    return NextResponse.json({
        rider: info.recordset[0] || null,
        kyc: kyc.recordset[0] || null,
        stats: counts.recordset[0] || { activeCount: 0, totalCount: 0 },
    });
}
