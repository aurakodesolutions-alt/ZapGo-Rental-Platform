import { NextRequest, NextResponse } from "next/server";
import { sql, getConnection } from "@/lib/db";
import { getRiderIdFromRequest } from "@/lib/auth/auth-rider";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const auth = getRiderIdFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const currentPassword = (body?.currentPassword || "").toString();
    const newPassword = (body?.newPassword || "").toString();

    if (!currentPassword || !newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "Invalid password payload" }, { status: 400 });
    }

    const pool = await getConnection();
    const r = await new sql.Request(pool)
        .input("rid", sql.Int, auth)
        .query(`SELECT PasswordHash FROM Riders WHERE RiderId=@rid`);

    if (!r.recordset.length) {
        return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }

    const hash = r.recordset[0].PasswordHash as string | null;
    if (!hash) {
        // first-time set
        const newHash = await bcrypt.hash(newPassword, 10);
        await new sql.Request(pool)
            .input("rid", sql.Int, auth)
            .input("hash", sql.NVarChar(255), newHash)
            .query(`UPDATE Riders SET PasswordHash=@hash WHERE RiderId=@rid`);
        return NextResponse.json({ ok: true });
    }

    const ok = await bcrypt.compare(currentPassword, hash);
    if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    const newHash = await bcrypt.hash(newPassword, 10);
    await new sql.Request(pool)
        .input("rid", sql.Int, auth)
        .input("hash", sql.NVarChar(255), newHash)
        .query(`UPDATE Riders SET PasswordHash=@hash WHERE RiderId=@rid`);

    return NextResponse.json({ ok: true });
}
