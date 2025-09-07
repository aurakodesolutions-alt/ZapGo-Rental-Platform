// app/api/v1/admin/staff/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateSchema = z.object({
    fullName: z.string().trim().min(2),
    email: z.string().trim().email(),
    position: z.string().trim().max(100).optional().nullable(),
    password: z.string().trim().min(6).optional(),
    kycVerified: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;
        const q = (sp.get("q") || "").trim();
        const verified = sp.get("verified");
        const limit = Math.max(1, Math.min(Number(sp.get("limit") || 50), 200));
        const offset = Math.max(0, Number(sp.get("offset") || 0));
        const format = (sp.get("format") || "").toLowerCase(); // csv?

        const pool = await getConnection();
        const r = new sql.Request(pool)
            .input("limit", sql.Int, limit)
            .input("offset", sql.Int, offset);

        let where = "1=1";
        if (q) {
            r.input("q", sql.NVarChar(256), `%${q}%`);
            where += ` AND (s.FullName LIKE @q OR s.Email LIKE @q OR s.Position LIKE @q OR CONVERT(nvarchar(50), s.StaffId) LIKE @q)`;
        }
        if (verified === "true") where += " AND s.KycVerified = 1";
        if (verified === "false") where += " AND s.KycVerified = 0";

        const sqlText = `
      WITH rows AS (
        SELECT
          s.StaffId, s.FullName, s.Email, s.Position, s.KycVerified, s.CreatedAtUtc
        FROM Staff s
        WHERE ${where}
      )
      SELECT * FROM rows
      ORDER BY CreatedAtUtc DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

        const res = await r.query(sqlText);
        const rows = res.recordset.map((x: any) => ({
            staffId: Number(x.StaffId),
            fullName: x.FullName,
            email: x.Email,
            position: x.Position,
            kycVerified: Boolean(x.KycVerified),
            createdAtUtc: x.CreatedAtUtc,
        }));

        if (format === "csv") {
            const header = "StaffId,FullName,Email,Position,KycVerified,CreatedAtUtc";
            const lines = rows.map(r =>
                [
                    r.staffId,
                    JSON.stringify(r.fullName),
                    JSON.stringify(r.email),
                    JSON.stringify(r.position ?? ""),
                    r.kycVerified ? "true" : "false",
                    new Date(r.createdAtUtc).toISOString(),
                ].join(",")
            );
            const csv = [header, ...lines].join("\n");
            return new NextResponse(csv, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="staff.csv"`,
                },
            });
        }

        return NextResponse.json({ ok: true, data: rows });
    } catch (e: any) {
        console.error("GET /admin/staff error:", e);
        return NextResponse.json({ ok: false, error: "Failed to load staff" }, { status: 400 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = CreateSchema.parse(body);

        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(data.password!, salt);
        const hashBuf = Buffer.from(hash, "utf8");

        const pool = await getConnection();
        const r = new sql.Request(pool)
            .input("fullName", sql.NVarChar(100), data.fullName)
            .input("email", sql.NVarChar(256), data.email)
            .input("position", sql.NVarChar(100), data.position ?? null)
            .input("kyc", sql.Bit, data.kycVerified ?? false);

        // If PasswordHash is VARBINARY(256) — store as bytes
        if (hash) r.input("hash", sql.VarBinary(256), hashBuf);

        const insertSql = `
      INSERT INTO Staff (FullName, Email, Position, PasswordHash, KycVerified, CreatedAtUtc)
      OUTPUT INSERTED.StaffId
      VALUES (@fullName, @email, @position, @hash, @kyc, SYSUTCDATETIME());
    `;

        const res = await r.query(insertSql);
        return NextResponse.json({ ok: true, data: { staffId: Number(res.recordset[0].StaffId) } }, { status: 201 });
    } catch (e: any) {
        const msg =
            e?.originalError?.info?.number === 2627 /* unique index */ ? "Email already exists" :
                e?.message || "Create failed";
        console.error("POST /admin/staff error:", e);
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
}
