// src/app/api/v1/rider/password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getRiderIdFromRequest } from "@/lib/auth/auth-rider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
    try {
        const riderId = await getRiderIdFromRequest(req);
        if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { currentPassword, newPassword } = await req.json();

        if (!newPassword || String(newPassword).length < 6) {
            return NextResponse.json({ error: "newPassword min length 6" }, { status: 400 });
        }

        const pool = await getConnection();
        const r = await pool.request().input("rid", sql.Int, riderId)
            .query("SELECT PasswordHash FROM Riders WHERE RiderId=@rid");

        if (!r.recordset.length) return NextResponse.json({ error: "Rider not found" }, { status: 404 });

        const hash = r.recordset[0].PasswordHash as string | null;

        if (hash) {
            // verify if a password already exists
            const ok = currentPassword ? await bcrypt.compare(currentPassword, hash) : false;
            if (!ok) return NextResponse.json({ error: "Current password incorrect" }, { status: 400 });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.request()
            .input("rid", sql.Int, riderId)
            .input("h", sql.NVarChar, newHash)
            .query("UPDATE Riders SET PasswordHash=@h WHERE RiderId=@rid");

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        const msg = e?.message === "UNAUTHORIZED" ? "Unauthorized" : (e?.message || "Failed");
        return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
    }
}
