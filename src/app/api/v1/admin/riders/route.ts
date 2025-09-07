import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getConnection, sql } from "@/lib/db";

/* ---------------- helpers ---------------- */
function rowToRider(row: any) {
    const kycPresent =
        row.AadhaarNumber ||
        row.PanNumber ||
        row.DrivingLicenseNumber ||
        row.AadhaarImageUrl ||
        row.PanCardImageUrl ||
        row.DrivingLicenseImageUrl ||
        row.SelfieImageUrl;

    return {
        riderId: row.RiderId,
        fullName: row.FullName,
        phone: row.Phone,
        email: row.Email,
        createdAtUtc: row.CreatedAtUtc ? new Date(row.CreatedAtUtc).toISOString() : undefined,
        kyc: kycPresent
            ? {
                riderId: row.RiderId,
                aadhaarNumber: row.AadhaarNumber ?? "",
                aadhaarImageUrl: row.AadhaarImageUrl ?? "",
                panNumber: row.PanNumber ?? "",
                panCardImageUrl: row.PanCardImageUrl ?? "",
                drivingLicenseNumber: row.DrivingLicenseNumber ?? null,
                drivingLicenseImageUrl: row.DrivingLicenseImageUrl ?? null,
                selfieImageUrl: row.SelfieImageUrl ?? "",
                kycCreatedAtUtc: row.KycCreatedAtUtc
                    ? new Date(row.KycCreatedAtUtc).toISOString()
                    : new Date().toISOString(),
            }
            : undefined,
    };
}

/* ---------------- zod ---------------- */
const ListQuery = z.object({
    q: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    offset: z.coerce.number().int().min(0).optional().default(0),
});

// absolute URL OR site-relative path OR empty
const FileUrl = z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ?? "").trim())
    .refine(
        (v) =>
            v === "" ||
            v.startsWith("/") ||
            /^https?:\/\//i.test(v),
        { message: "Must be a valid URL or site-relative path" }
    );

const RiderCreateSchema = z.object({
    fullName: z.string().min(1),
    phone: z.string().min(5),
    email: z.string().email(),
    // NEW: password is optional; if provided, must be >= 6
    password: z.string().min(6).optional(),
    kyc: z
        .object({
            aadhaarNumber: z.string().length(12),
            aadhaarImageUrl: FileUrl,
            panNumber: z.string().length(10),
            panCardImageUrl: FileUrl,
            drivingLicenseNumber: z.string().optional().nullable(),
            drivingLicenseImageUrl: FileUrl.nullable(),
            // NEW: selfie support
            selfieImageUrl: FileUrl,
        })
        .optional(),
});

function emptyToNull(v?: string | null) {
    if (v == null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
}

/* ---------------- GET /riders ---------------- */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const parsed = ListQuery.parse({
            q: searchParams.get("q") ?? undefined,
            limit: searchParams.get("limit") ?? undefined,
            offset: searchParams.get("offset") ?? undefined,
        });

        const pool = await getConnection();
        const r = new sql.Request(pool)
            .input("Limit", sql.Int, parsed.limit)
            .input("Offset", sql.Int, parsed.offset);

        let where = "";
        if (parsed.q) {
            r.input("Q", sql.NVarChar(256), `%${parsed.q}%`);
            where = `WHERE (r.FullName LIKE @Q OR r.Phone LIKE @Q OR r.Email LIKE @Q)`;
        }

        const result = await r.query(`
            SELECT
                r.RiderId, r.FullName, r.Phone, r.Email, r.CreatedAtUtc,
                k.AadhaarNumber, k.AadhaarImageUrl, k.PanNumber, k.PanCardImageUrl,
                k.DrivingLicenseNumber, k.DrivingLicenseImageUrl, k.SelfieImageUrl, k.KycCreatedAtUtc
            FROM dbo.Riders r
                     LEFT JOIN dbo.RiderKyc k ON k.RiderId = r.RiderId
                ${where}
            ORDER BY r.RiderId DESC
            OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
        `);

        const data = (result.recordset || []).map(rowToRider);
        return NextResponse.json({ ok: true, data });
    } catch (err) {
        console.error("GET /riders error:", err);
        return NextResponse.json({ ok: false, error: "Failed to list riders" }, { status: 500 });
    }
}

/* ---------------- POST /riders ---------------- */
export async function POST(req: NextRequest) {
    let trx: sql.Transaction | null = null;

    try {
        const body = RiderCreateSchema.parse(await req.json());
        const pool = await getConnection();

        trx = new sql.Transaction(pool);
        await trx.begin();

        const tReq = () => new sql.Request(trx!);

        // Hash password if provided
        const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : null;

        // Insert Rider (now includes PasswordHash + IsActive)
        const r = tReq()
            .input("FullName", sql.NVarChar(100), body.fullName)
            .input("Phone", sql.VarChar(15), body.phone)
            .input("Email", sql.NVarChar(256), body.email)
            .input("PasswordHash", sql.NVarChar(255), passwordHash);

        const insertRiderSql = `
      SET NOCOUNT ON;
      INSERT INTO dbo.Riders (FullName, Phone, Email, PasswordHash, CreatedAtUtc, IsActive)
      VALUES (@FullName, @Phone, @Email, @PasswordHash, SYSUTCDATETIME(), 1);
      SELECT CAST(SCOPE_IDENTITY() AS INT) AS NewId;
    `;
        const ins = await r.query<{ NewId: number }>(insertRiderSql);
        const riderId = ins.recordset?.[0]?.NewId;
        if (!riderId) {
            throw new Error("Insert succeeded but id not returned");
        }

        // Optional KYC insert (now includes SelfieImageUrl)
        if (body.kyc) {
            await tReq()
                .input("RiderId", sql.Int, riderId)
                .input("AadhaarNumber", sql.Char(12), body.kyc.aadhaarNumber)
                .input("AadhaarImageUrl", sql.NVarChar(2048), emptyToNull(body.kyc.aadhaarImageUrl))
                .input("PanNumber", sql.Char(10), body.kyc.panNumber)
                .input("PanCardImageUrl", sql.NVarChar(2048), emptyToNull(body.kyc.panCardImageUrl))
                .input("DrivingLicenseNumber", sql.NVarChar(32), emptyToNull(body.kyc.drivingLicenseNumber ?? null))
                .input("DrivingLicenseImageUrl", sql.NVarChar(2048), emptyToNull(body.kyc.drivingLicenseImageUrl ?? null))
                .input("SelfieImageUrl", sql.NVarChar(2048), emptyToNull(body.kyc.selfieImageUrl))
                .query(`
          INSERT INTO dbo.RiderKyc
            (RiderId, AadhaarNumber, AadhaarImageUrl, PanNumber, PanCardImageUrl,
             DrivingLicenseNumber, DrivingLicenseImageUrl, SelfieImageUrl, KycCreatedAtUtc)
          VALUES
            (@RiderId, @AadhaarNumber, @AadhaarImageUrl, @PanNumber, @PanCardImageUrl,
             @DrivingLicenseNumber, @DrivingLicenseImageUrl, @SelfieImageUrl, SYSUTCDATETIME());
        `);
        }

        await trx.commit();
        trx = null;

        // Return the newly created rider (LEFT JOIN)
        const rowRs = await pool
            .request()
            .input("RiderId", sql.Int, riderId)
            .query(`
        SELECT
          r.RiderId, r.FullName, r.Phone, r.Email, r.CreatedAtUtc,
          k.AadhaarNumber, k.AadhaarImageUrl, k.PanNumber, k.PanCardImageUrl,
          k.DrivingLicenseNumber, k.DrivingLicenseImageUrl, k.SelfieImageUrl, k.KycCreatedAtUtc
        FROM dbo.Riders r
        LEFT JOIN dbo.RiderKyc k ON k.RiderId = r.RiderId
        WHERE r.RiderId = @RiderId;
      `);

        return NextResponse.json({ ok: true, data: rowToRider(rowRs.recordset[0]) });
    } catch (err: any) {
        try {
            if (trx && (trx as any)._aborted !== true) {
                await trx.rollback();
            }
        } catch { /* ignore */ }

        if (err?.issues) {
            return NextResponse.json(
                { ok: false, error: "Validation failed", details: err.issues },
                { status: 422 }
            );
        }
        console.error("POST /riders error:", err);
        return NextResponse.json({ ok: false, error: err?.message || "Failed to create rider" }, { status: 500 });
    }
}
