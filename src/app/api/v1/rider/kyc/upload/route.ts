// app/api/v1/rider/kyc/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";
import path from "path";
import fs from "fs/promises";

async function getRiderIdFromRequest(req: NextRequest): Promise<number | null> {
    try {
        const rid = req.headers.get("x-rider-id");
        if (rid) return Number(rid);
    } catch {}
    return null;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const riderId = await getRiderIdFromRequest(req);
    if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();

    const files: Record<string, File | null> = {
        aadhaarFile: form.get("aadhaarFile") as File | null,
        panFile: form.get("panFile") as File | null,
        dlFile: form.get("dlFile") as File | null,
        selfieFile: form.get("selfieFile") as File | null,
    };

    const saved: Record<string, string | null> = {
        aadhaarFile: null,
        panFile: null,
        dlFile: null,
        selfieFile: null,
    };

    const baseDir = path.join(process.cwd(), "public", "images", "riders", String(riderId));
    await fs.mkdir(baseDir, { recursive: true });

    // Save helper
    const saveOne = async (key: keyof typeof files, prefix: string) => {
        const f = files[key];
        if (!f || typeof f.arrayBuffer !== "function") return;

        const buf = Buffer.from(await f.arrayBuffer());
        const ext = (f.name?.split(".").pop() || "jpg").toLowerCase();
        const safeExt = ext.match(/^[a-z0-9]{1,5}$/) ? ext : "jpg";
        const filename = `${prefix}.${safeExt}`;
        const diskPath = path.join(baseDir, filename);
        await fs.writeFile(diskPath, buf);

        // public URL
        const url = `/images/riders/${riderId}/${filename}`;
        saved[key] = url;
    };

    await Promise.all([
        saveOne("aadhaarFile", "aadhaar"),
        saveOne("panFile", "pan"),
        saveOne("dlFile", "dl"),
        saveOne("selfieFile", "selfie"),
    ]);

    const pool = await getConnection();
    await pool
        .request()
        .input("rid", sql.Int, riderId)
        .input("aadhaarUrl", sql.NVarChar(2048), saved.aadhaarFile)
        .input("panUrl", sql.NVarChar(2048), saved.panFile)
        .input("dlUrl", sql.NVarChar(2048), saved.dlFile)
        .input("selfieUrl", sql.NVarChar(2048), saved.selfieFile)
        .query(`
      MERGE RiderKyc AS tgt
      USING (SELECT @rid AS RiderId) AS src
      ON tgt.RiderId = src.RiderId
      WHEN MATCHED THEN UPDATE SET
        AadhaarImageUrl = COALESCE(@aadhaarUrl, AadhaarImageUrl),
        PanCardImageUrl = COALESCE(@panUrl, PanCardImageUrl),
        DrivingLicenseImageUrl = COALESCE(@dlUrl, DrivingLicenseImageUrl),
        SelfieImageUrl = COALESCE(@selfieUrl, SelfieImageUrl),
        KycCreatedAtUtc = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (RiderId, AadhaarImageUrl, PanCardImageUrl, DrivingLicenseImageUrl, SelfieImageUrl, KycCreatedAtUtc)
        VALUES (@rid, @aadhaarUrl, @panUrl, @dlUrl, @selfieUrl, SYSUTCDATETIME());
    `);

    return NextResponse.json({ ok: true, data: saved });
}
