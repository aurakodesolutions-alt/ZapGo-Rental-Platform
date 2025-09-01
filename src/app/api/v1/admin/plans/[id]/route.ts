// /app/api/admin/plans/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";

const IdSchema = z.object({ id: z.coerce.number().int().positive() });

const PlanUpdateSchema = z.object({
    planName: z.string().min(2).optional(),
    requiredDocuments: z.array(z.string()).optional(),
    features: z.unknown().optional(),
});

type PlanRow = {
    PlanId: number;
    PlanName: string;
    Features: string | null;
    RequiredDocuments: string | null;
    CreatedAt: string;
    UpdatedAt: string;
};

function toDbJson(v: unknown): string | null {
    if (v === undefined || v === null) return null;
    if (typeof v === "string") {
        const s = v.trim();
        if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) return s;
        return JSON.stringify([s]);
    }
    return JSON.stringify(v);
}
function parseDbJson<T = unknown>(s: string | null): T | undefined {
    if (!s) return undefined;
    try { return JSON.parse(s) as T; } catch { return undefined; }
}

// GET /api/admin/plans/:id
export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const id = Number((await (props.params)).id);
        const pool = await getConnection();
        const res = await new sql.Request(pool)
            .input("PlanId", sql.Int, id)
            .query<PlanRow>(`SELECT PlanId, PlanName, Features, RequiredDocuments, CreatedAt, UpdatedAt
                       FROM dbo.Plans WHERE PlanId = @PlanId`);

        if (res.recordset.length === 0) {
            return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        }

        const row = res.recordset[0];
        return NextResponse.json({
            ok: true,
            data: {
                planId: row.PlanId,
                planName: row.PlanName,
                features: parseDbJson(row.Features),
                requiredDocuments: parseDbJson<string[]>(row.RequiredDocuments) || [],
                createdAt: row.CreatedAt,
                updatedAt: row.UpdatedAt,
            },
        });
    } catch (err: any) {
        if (err?.issues) {
            return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
        }
        console.error("GET /api/admin/plans/:id error:", err);
        return NextResponse.json({ ok: false, error: "Failed to load plan" }, { status: 500 });
    }
}

// PUT /api/admin/plans/:id
export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const id = Number((await (props.params)).id);
        // const { id } = IdSchema.parse(params);
        const body = PlanUpdateSchema.parse(await req.json());

        const pool = await getConnection();

        // Ensure exists
        const exists = await new sql.Request(pool)
            .input("PlanId", sql.Int, id)
            .query(`SELECT 1 FROM dbo.Plans WHERE PlanId = @PlanId`);
        if (!exists.recordset.length) {
            return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        }

        // Unique name check (if changing name)
        if (body.planName) {
            const dup = await new sql.Request(pool)
                .input("PlanName", sql.NVarChar(100), body.planName)
                .input("PlanId", sql.Int, id)
                .query(`SELECT 1 FROM dbo.Plans WHERE PlanName = @PlanName AND PlanId <> @PlanId`);
            if (dup.recordset.length) {
                return NextResponse.json({ ok: false, error: "Plan name already exists" }, { status: 409 });
            }
        }

        const featuresJson =
            body.features === undefined ? undefined : toDbJson(body.features);
        const docsJson =
            body.requiredDocuments === undefined ? undefined : toDbJson(body.requiredDocuments);

        // Build dynamic UPDATE safely
        const sets: string[] = [];
        const reqUpd = new sql.Request(pool).input("PlanId", sql.Int, id);

        if (body.planName !== undefined) {
            sets.push("PlanName = @PlanName");
            reqUpd.input("PlanName", sql.NVarChar(100), body.planName);
        }
        if (featuresJson !== undefined) {
            sets.push("Features = @Features");
            reqUpd.input("Features", sql.NVarChar(sql.MAX), featuresJson);
        }
        if (docsJson !== undefined) {
            sets.push("RequiredDocuments = @RequiredDocuments");
            reqUpd.input("RequiredDocuments", sql.NVarChar(sql.MAX), docsJson);
        }

        if (sets.length === 0) {
            return NextResponse.json({ ok: true, data: null }); // nothing to update
        }

// ❌ REMOVE OUTPUT (conflicts with AFTER trigger)
// ✅ Just update, then select the row back so UpdatedAt reflects the trigger
        await reqUpd.query(`
  UPDATE dbo.Plans
  SET ${sets.join(", ")}
  WHERE PlanId = @PlanId;
`);

// Read back the updated row (includes UpdatedAt from trigger)
        const select = await new sql.Request(pool)
            .input("PlanId", sql.Int, id)
            .query<PlanRow>(`
                SELECT PlanId, PlanName, Features, RequiredDocuments, CreatedAt, UpdatedAt
                FROM dbo.Plans
                WHERE PlanId = @PlanId;
            `);

        const row = select.recordset[0];

        return NextResponse.json({
            ok: true,
            data: {
                planId: row.PlanId,
                planName: row.PlanName,
                features: parseDbJson(row.Features),
                requiredDocuments: parseDbJson<string[]>(row.RequiredDocuments) || [],
                createdAt: row.CreatedAt,
                updatedAt: row.UpdatedAt,
            },
        });
    } catch (err: any) {
        if (err?.issues) {
            return NextResponse.json({ ok: false, error: "Validation failed", details: err.issues }, { status: 422 });
        }
        console.error("PUT /api/admin/plans/:id error:", err);
        return NextResponse.json({ ok: false, error: "Failed to update plan" }, { status: 500 });
    }
}

// DELETE /api/admin/plans/:id
export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const id = Number((await (props.params)).id);

        const pool = await getConnection();

        // Try delete; FK references (Vehicles/Rentals) may block
        const del = await new sql.Request(pool)
            .input("PlanId", sql.Int, id)
            .query(`
        DELETE FROM dbo.Plans WHERE PlanId = @PlanId;
        SELECT @@ROWCOUNT AS Affected;
      `);

        const affected = (del.recordset?.[0]?.Affected ?? 0) as number;
        if (affected === 0) {
            return NextResponse.json({ ok: false, error: "Not found or already deleted" }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        // SQL Server FK violation number could vary depending on driver; return 409 generically
        console.error("DELETE /api/admin/plans/:id error:", err);
        return NextResponse.json(
            { ok: false, error: "Cannot delete plan because it is in use" },
            { status: 409 }
        );
    }
}
