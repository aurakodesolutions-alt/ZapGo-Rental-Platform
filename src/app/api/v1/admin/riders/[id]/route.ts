import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConnection, sql } from "@/lib/db";

/* ---------------- helpers ---------------- */
function rowToRider(row: any) {
    const kycPresent =
        row.AadhaarNumber ||
        row.PanNumber ||
        row.DrivingLicenseNumber ||
        row.AadhaarImageUrl ||
        row.PanCardImageUrl ||
        row.DrivingLicenseImageUrl;

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
                kycCreatedAtUtc: row.KycCreatedAtUtc
                    ? new Date(row.KycCreatedAtUtc).toISOString()
                    : new Date().toISOString(),
            }
            : undefined,
    };
}

/* ---------------- zod ---------------- */
const IdSchema = z.object({ id: z.coerce.number().int().min(1) });

const RiderUpdateSchema = z.object({
    fullName: z.string().min(1).optional(),
    phone: z.string().min(5).optional(),
    email: z.string().email().optional(),
    kyc: z
        .object({
            aadhaarNumber: z.string().length(12).optional(),
            aadhaarImageUrl: z.string().url().optional().nullable(),
            panNumber: z.string().length(10).optional(),
            panCardImageUrl: z.string().url().optional().nullable(),
            drivingLicenseNumber: z.string().optional().nullable(),
            drivingLicenseImageUrl: z.string().url().optional().nullable(),
        })
        .optional(),
});

/* ---------------- GET /riders/:id ---------------- */
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = IdSchema.parse({ id: params.id });
        const pool = await getConnection();

        const rs = await pool
            .request()
            .input("RiderId", sql.Int, id)
            .query(`
                SELECT
                    r.RiderId, r.FullName, r.Phone, r.Email, r.CreatedAtUtc,
                    k.AadhaarNumber, k.AadhaarImageUrl, k.PanNumber, k.PanCardImageUrl,
                    k.DrivingLicenseNumber, k.DrivingLicenseImageUrl, k.KycCreatedAtUtc
                FROM dbo.Riders r
                         LEFT JOIN dbo.RiderKyc k ON k.RiderId = r.RiderId
                WHERE r.RiderId = @RiderId;
            `);

        const row = rs.recordset[0];
        if (!row) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ ok: true, data: rowToRider(row) });
    } catch (err) {
        console.error("GET /riders/:id error:", err);
        return NextResponse.json({ ok: false, error: "Failed to get rider" }, { status: 500 });
    }
}

/* ---------------- PUT /riders/:id ---------------- */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = IdSchema.parse({ id: params.id });
        const body = RiderUpdateSchema.parse(await req.json());
        const pool = await getConnection();

        // ensure rider exists
        const exists = await pool
            .request()
            .input("RiderId", sql.Int, id)
            .query(`SELECT 1 FROM dbo.Riders WHERE RiderId = @RiderId`);
        if (!exists.recordset.length) {
            return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        }

        // dynamic rider update
        if (body.fullName !== undefined || body.phone !== undefined || body.email !== undefined) {
            const setParts: string[] = [];
            const r = new sql.Request(pool).input("RiderId", sql.Int, id);

            if (body.fullName !== undefined) {
                setParts.push("FullName = @FullName");
                r.input("FullName", sql.NVarChar(100), body.fullName);
            }
            if (body.phone !== undefined) {
                setParts.push("Phone = @Phone");
                r.input("Phone", sql.VarChar(15), body.phone);
            }
            if (body.email !== undefined) {
                setParts.push("Email = @Email");
                r.input("Email", sql.NVarChar(256), body.email);
            }

            await r.query(`
                UPDATE dbo.Riders
                SET ${setParts.join(", ")}
                WHERE RiderId = @RiderId;
            `);
        }

        // KYC upsert (if provided)
        if (body.kyc) {
            const k = new sql.Request(pool)
                .input("RiderId", sql.Int, id)
                .input("AadhaarNumber", sql.Char(12), body.kyc.aadhaarNumber ?? null)
                .input("AadhaarImageUrl", sql.NVarChar(2048), body.kyc.aadhaarImageUrl ?? null)
                .input("PanNumber", sql.Char(10), body.kyc.panNumber ?? null)
                .input("PanCardImageUrl", sql.NVarChar(2048), body.kyc.panCardImageUrl ?? null)
                .input("DrivingLicenseNumber", sql.NVarChar(32), body.kyc.drivingLicenseNumber ?? null)
                .input("DrivingLicenseImageUrl", sql.NVarChar(2048), body.kyc.drivingLicenseImageUrl ?? null);

            // MERGE to insert or update (no ProPlan anymore)
            await k.query(`
        MERGE dbo.RiderKyc AS target
        USING (SELECT @RiderId AS RiderId) AS src
        ON (target.RiderId = src.RiderId)
        WHEN MATCHED THEN
          UPDATE SET
            AadhaarNumber = COALESCE(@AadhaarNumber, target.AadhaarNumber),
            AadhaarImageUrl = COALESCE(@AadhaarImageUrl, target.AadhaarImageUrl),
            PanNumber = COALESCE(@PanNumber, target.PanNumber),
            PanCardImageUrl = COALESCE(@PanCardImageUrl, target.PanCardImageUrl),
            DrivingLicenseNumber = @DrivingLicenseNumber,
            DrivingLicenseImageUrl = @DrivingLicenseImageUrl
        WHEN NOT MATCHED THEN
          INSERT (RiderId, AadhaarNumber, AadhaarImageUrl, PanNumber, PanCardImageUrl,
                  DrivingLicenseNumber, DrivingLicenseImageUrl, KycCreatedAtUtc)
          VALUES ( @RiderId, @AadhaarNumber, @AadhaarImageUrl, @PanNumber, @PanCardImageUrl,
                   @DrivingLicenseNumber, @DrivingLicenseImageUrl, SYSUTCDATETIME());
      `);
        }

        // return updated
        const rs = await pool
            .request()
            .input("RiderId", sql.Int, id)
            .query(`
                SELECT
                    r.RiderId, r.FullName, r.Phone, r.Email, r.CreatedAtUtc,
                    k.AadhaarNumber, k.AadhaarImageUrl, k.PanNumber, k.PanCardImageUrl,
                    k.DrivingLicenseNumber, k.DrivingLicenseImageUrl, k.KycCreatedAtUtc
                FROM dbo.Riders r
                         LEFT JOIN dbo.RiderKyc k ON k.RiderId = r.RiderId
                WHERE r.RiderId = @RiderId;
            `);

        return NextResponse.json({ ok: true, data: rowToRider(rs.recordset[0]) });
    } catch (err: any) {
        if (err?.issues) {
            return NextResponse.json(
                { ok: false, error: "Validation failed", details: err.issues },
                { status: 422 }
            );
        }
        console.error("PUT /riders/:id error:", err);
        return NextResponse.json({ ok: false, error: "Failed to update rider" }, { status: 500 });
    }
}

/* ---------------- DELETE /riders/:id ---------------- */
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        const pool = await getConnection();

        // Delete child then parent (if FK not cascading)
        await pool.request().input("RiderId", sql.Int, id).query(`
            DELETE FROM dbo.RiderKyc WHERE RiderId = @RiderId;
            DELETE FROM dbo.Riders WHERE RiderId = @RiderId;
        `);

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("DELETE /riders/:id error:", err);
        return NextResponse.json({ ok: false, error: "Failed to delete rider" }, { status: 500 });
    }
}
