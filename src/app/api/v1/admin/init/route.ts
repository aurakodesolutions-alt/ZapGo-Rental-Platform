// /app/api/admin/init/route.ts  (served at /api/admin/init)
import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";   // <-- use your helper
import sql from "mssql";                    // <-- import sql directly
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

type Body = {
    fullName?: string;
    email?: string;
    password?: string;
};

function isEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: NextRequest) {
    // 1) Secret must be set server-side
    const envSecret = process.env.ADMIN_INIT_SECRET || "";
    if (!envSecret) {
        return NextResponse.json(
            { ok: false, error: "Server misconfigured: ADMIN_INIT_SECRET is not set" },
            { status: 500 }
        );
    }

    // 2) Secret must match header
    const headerSecret = req.headers.get("x-admin-init-secret") || "";
    if (headerSecret !== envSecret) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 3) Parse JSON safely
    let body: Body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { fullName, email, password } = body || {};

    // 4) Validate input
    if (!fullName || !email || !password) {
        return NextResponse.json(
            { ok: false, error: "fullName, email, and password are required" },
            { status: 422 }
        );
    }
    if (!isEmail(email)) {
        return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 422 });
    }
    if (password.length < 8) {
        return NextResponse.json({ ok: false, error: "Password too short" }, { status: 422 });
    }

    // 5) DB work (using your getConnection)
    try {
        const pool = await getConnection();
        const tx = new sql.Transaction(pool);

        try {
            await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

            // lock to prevent races
            const check = await new sql.Request(tx).query(`
                SELECT TOP 1 AdminId
                FROM dbo.Admins WITH (UPDLOCK, HOLDLOCK)
                ORDER BY AdminId ASC
            `);

            if (check.recordset.length > 0) {
                await tx.rollback();
                return NextResponse.json(
                    { ok: false, error: "An admin already exists. Bootstrap not allowed." },
                    { status: 409 }
                );
            }

            const salt = await bcrypt.genSalt(12);
            const hash = await bcrypt.hash(password, salt);
            const hashBuf = Buffer.from(hash, "utf8");

            const insert = await new sql.Request(tx)
                .input("FullName", sql.NVarChar(100), fullName)
                .input("Email", sql.NVarChar(256), email.toLowerCase())
                .input("PasswordHash", sql.VarBinary(256), hashBuf)
                .query(`
                    INSERT INTO dbo.Admins (FullName, Email, PasswordHash)
                        OUTPUT INSERTED.AdminId, INSERTED.Email
                    VALUES (@FullName, @Email, @PasswordHash);
                `);

            await tx.commit();

            const created = insert.recordset[0];
            return NextResponse.json(
                { ok: true, adminId: created.AdminId, email: created.Email },
                { status: 201 }
            );
        } catch (e: any) {
            try { await tx.rollback(); } catch {}
            console.error("admin/init tx error:", e);
            return NextResponse.json(
                { ok: false, error: "Failed to initialize admin" },
                { status: 500 }
            );
        }
    } catch (e: any) {
        console.error("admin/init outer error:", e);
        return NextResponse.json({ ok: false, error: "Unexpected server error" }, { status: 500 });
    }
}
