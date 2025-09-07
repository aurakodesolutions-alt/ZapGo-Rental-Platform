// app/api/v1/rider/kyc/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";
import {getRiderIdFromRequest} from "@/lib/auth/auth-rider";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const riderId = await getRiderIdFromRequest(req);
    if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pool = await getConnection();
    const r = await pool
        .request()
        .input("rid", sql.Int, riderId)
        .query(`
      SELECT TOP 1
        k.AadhaarNumber      AS aadhaarNumber,
        k.PanNumber          AS panNumber,
        k.DrivingLicenseNumber AS drivingLicenseNumber,
        k.AadhaarImageUrl    AS aadhaarImageUrl,
        k.PanCardImageUrl    AS panCardImageUrl,
        k.DrivingLicenseImageUrl AS drivingLicenseImageUrl,
        k.SelfieImageUrl     AS selfieImageUrl,
        k.KycCreatedAtUtc    AS kycCreatedAtUtc
      FROM RiderKyc k WITH (NOLOCK)
      WHERE k.RiderId = @rid
    `);

    const row = r.recordset[0] || null;

    // simple status: if either Aadhaar or PAN exists -> PENDING, else missing
    const status: "VERIFIED" | "PENDING" | "REJECTED" =
        row && (row.aadhaarNumber || row.panNumber) ? "PENDING" : "REJECTED";

    return NextResponse.json({ ...(row || {}), status });
}

export async function PATCH(req: NextRequest) {
    const riderId = await getRiderIdFromRequest(req);
    if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null as any);
    const aadhaar = body?.aadhaarNumber ?? null;
    const pan = body?.panNumber ?? null;
    const dl = body?.drivingLicenseNumber ?? null;

    const pool = await getConnection();

    await pool
        .request()
        .input("rid", sql.Int, riderId)
        .input("aadhaar", sql.Char(12), aadhaar)
        .input("pan", sql.Char(10), pan)
        .input("dl", sql.NVarChar(32), dl)
        .query(`
      MERGE RiderKyc AS tgt
      USING (SELECT @rid AS RiderId) AS src
      ON tgt.RiderId = src.RiderId
      WHEN MATCHED THEN UPDATE SET
        AadhaarNumber = @aadhaar,
        PanNumber = @pan,
        DrivingLicenseNumber = @dl,
        KycCreatedAtUtc = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (RiderId, AadhaarNumber, PanNumber, DrivingLicenseNumber, KycCreatedAtUtc)
        VALUES (@rid, @aadhaar, @pan, @dl, SYSUTCDATETIME());
    `);

    return NextResponse.json({ ok: true });
}
