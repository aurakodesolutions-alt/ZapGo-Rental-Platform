import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getConnection, sql } from "@/lib/db";
import { issueRiderSession } from "@/lib/auth/auth-rider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const { phoneOrEmail, password } = await req.json().catch(() => ({}));
    if (!phoneOrEmail || !password) {
        return NextResponse.json({ error: "phoneOrEmail and password required" }, { status: 400 });
    }

    const pool = await getConnection();
    const r = await pool.request()
        .input("q", sql.VarChar, phoneOrEmail)
        .query(`
      SELECT RiderId, FullName, PasswordHash, IsActive
      FROM Riders
      WHERE Phone=@q OR Email=@q
    `);

    if (!r.recordset.length) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    const row = r.recordset[0];
    if (!row.IsActive) return NextResponse.json({ error: "Account disabled" }, { status: 403 });

    const ok = row.PasswordHash && (await bcrypt.compare(password, row.PasswordHash));
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    // Update last login (best effort)
    pool.request()
        .input("rid", sql.Int, row.RiderId)
        .query(`UPDATE Riders SET LastLoginAtUtc = SYSUTCDATETIME() WHERE RiderId=@rid`)
        .catch(() => {});

    const res = NextResponse.json({ ok: true, riderId: row.RiderId, name: row.FullName });
    await issueRiderSession(res, row.RiderId, row.FullName);
    return res;
}
