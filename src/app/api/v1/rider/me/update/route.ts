import { NextRequest, NextResponse } from "next/server";
import { sql, getConnection } from "@/lib/db";
import { getRiderIdFromRequest } from "@/lib/auth/auth-rider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const auth = getRiderIdFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const fullName = (body?.fullName || "").toString().trim();
    const phone = (body?.phone || "").toString().trim();
    const email = (body?.email || "").toString().trim();

    if (!fullName || !phone || !email) {
        return NextResponse.json({ error: "Missing fullName/phone/email" }, { status: 400 });
    }

    const pool = await getConnection();
    await new sql.Request(pool)
        .input("rid", sql.Int, auth)
        .input("fullName", sql.NVarChar(100), fullName)
        .input("phone", sql.VarChar(15), phone)
        .input("email", sql.NVarChar(256), email)
        .query(`
      UPDATE Riders
      SET FullName=@fullName, Phone=@phone, Email=@email
      WHERE RiderId=@rid
    `);

    return NextResponse.json({ ok: true });
}
