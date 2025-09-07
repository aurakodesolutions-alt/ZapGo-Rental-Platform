// app/api/v1/admin/staff/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z.object({
    fullName: z.string().trim().min(2).optional(),
    email: z.string().trim().email().optional(),
    position: z.string().trim().max(100).optional().nullable(),
    kycVerified: z.boolean().optional(),
    password: z.string().trim().min(6).optional(),
});

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const id = Number((await props.params).id);
        const pool = await getConnection();
        const res = await new sql.Request(pool)
            .input("id", sql.Int, id)
            .query(`
        SELECT StaffId, FullName, Email, Position, KycVerified, CreatedAtUtc
        FROM Staff WHERE StaffId=@id;
      `);

        if (!res.recordset.length) {
            return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        }

        const s = res.recordset[0];
        return NextResponse.json({
            ok: true,
            data: {
                staffId: Number(s.StaffId),
                fullName: s.FullName,
                email: s.Email,
                position: s.Position,
                kycVerified: Boolean(s.KycVerified),
                createdAtUtc: s.CreatedAtUtc,
            },
        });
    } catch (e) {
        return NextResponse.json({ ok: false, error: "Failed" }, { status: 400 });
    }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const id = Number((await props.params).id);
        const body = await req.json();
        const data = PatchSchema.parse(body);

        const pool = await getConnection();
        const r = new sql.Request(pool).input("id", sql.Int, id);

        const sets: string[] = ["UpdatedAtUtc = SYSUTCDATETIME()"];
        if (data.fullName !== undefined) {
            r.input("fullName", sql.NVarChar(100), data.fullName);
            sets.push("FullName=@fullName");
        }
        if (data.email !== undefined) {
            r.input("email", sql.NVarChar(256), data.email);
            sets.push("Email=@email");
        }
        if (data.position !== undefined) {
            r.input("position", sql.NVarChar(100), data.position ?? null);
            sets.push("Position=@position");
        }
        if (data.kycVerified !== undefined) {
            r.input("kyc", sql.Bit, data.kycVerified);
            sets.push("KycVerified=@kyc");
        }
        if (data.password) {
            const hash = await bcrypt.hash(data.password, 10);
            r.input("hash", sql.NVarChar(255), hash);
            sets.push("PasswordHash=CONVERT(VARBINARY(256), @hash)");
        }

        if (sets.length === 1) {
            return NextResponse.json({ ok: true, message: "No changes" });
        }

        const sqlText = `UPDATE Staff SET ${sets.join(", ")} WHERE StaffId=@id;`;
        await r.query(sqlText);
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        const msg =
            e?.originalError?.info?.number === 2627 ? "Email already exists" :
                e?.message || "Update failed";
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const id = Number((await props.params).id);
        const pool = await getConnection();
        await new sql.Request(pool)
            .input("id", sql.Int, id)
            .query(`DELETE FROM Staff WHERE StaffId=@id;`);
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ ok: false, error: "Delete failed" }, { status: 400 });
    }
}
