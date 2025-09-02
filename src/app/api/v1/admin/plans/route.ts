// /app/api/admin/plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";

// ----- Validation
const PlanCreateSchema = z.object({
    planName: z.string().min(2),
    requiredDocuments: z.array(z.string()).optional().default([]),
    joiningFees: z.coerce.number().min(0, 'Must be ≥ 0'),
    securityDeposit: z.coerce.number().min(0, 'Must be ≥ 0'),
    // Either an array/object or a string that represents JSON; UI already sends normalized “features”
    features: z.unknown().optional(), // we'll JSON.stringify whatever comes in (if defined)
});

type PlanRow = {
    PlanId: number;
    PlanName: string;
    Features: string | null;            // JSON in NVARCHAR(MAX)
    JoiningFee:number;
    SecurityDeposit:number;
    RequiredDocuments: string | null;   // JSON array
    CreatedAt: string;
    UpdatedAt: string;
};

// ----- Helpers
function toDbJson(v: unknown): string | null {
    if (v === undefined || v === null) return null;
    // If string already looks like JSON, keep as-is; otherwise JSON.stringify
    if (typeof v === "string") {
        const s = v.trim();
        if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) return s;
        // treat plain strings as a single-element list to be consistent
        return JSON.stringify([s]);
    }
    return JSON.stringify(v);
}

function parseDbJson<T = unknown>(s: string | null): T | undefined {
    if (!s) return undefined;
    try { return JSON.parse(s) as T; } catch { return undefined; }
}

// GET /api/admin/plans?q=&limit=&offset=
export async function GET(req: NextRequest) {
    try {
        const pool = await getConnection();
        const { searchParams } = new URL(req.url);

        const q = (searchParams.get("q") || "").trim();
        const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 200);
        const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

        // Simple search over PlanName + the JSON NVARCHARs using LIKE
        // Note: for big data, consider a computed column or full-text/JSON parsing.
        const like = `%${q.replace(/[%_]/g, "")}%`; // crude escape of wildcards

        const request = new sql.Request(pool)
            .input("Like", sql.NVarChar(300), like)
            .input("Limit", sql.Int, limit)
            .input("Offset", sql.Int, offset);

        const query = q
            ? `
        SELECT PlanId, PlanName, Features, RequiredDocuments, JoiningFee, SecurityDeposit, CreatedAt, UpdatedAt
        FROM dbo.Plans
        WHERE PlanName LIKE @Like
           OR (Features IS NOT NULL AND Features LIKE @Like)
           OR (RequiredDocuments IS NOT NULL AND RequiredDocuments LIKE @Like)
        ORDER BY PlanId DESC
        OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
      `
            : `
        SELECT PlanId, PlanName, Features, RequiredDocuments, JoiningFee, SecurityDeposit, CreatedAt, UpdatedAt
        FROM dbo.Plans
        ORDER BY PlanId DESC
        OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
      `;

        const rows = (await request.query<PlanRow>(query)).recordset;

        const data = rows.map(r => ({
            planId: r.PlanId,
            planName: r.PlanName,
            features: parseDbJson(r.Features),
            joiningFees:r.JoiningFee,
            securityDeposit:r.SecurityDeposit,
            requiredDocuments: parseDbJson<string[]>(r.RequiredDocuments) || [],
            createdAt: r.CreatedAt,
            updatedAt: r.UpdatedAt,
        }));

        return NextResponse.json({ ok: true, data });
    } catch (err: any) {
        console.error("GET /api/admin/plans error:", err);
        return NextResponse.json({ ok: false, error: "Failed to load plans" }, { status: 500 });
    }
}

// POST /api/admin/plans
export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const body = PlanCreateSchema.parse(json);

        const pool = await getConnection();

        // enforce uniqueness on PlanName at app level (there’s also a UNIQUE in DB)
        const dup = await new sql.Request(pool)
            .input("PlanName", sql.NVarChar(100), body.planName)
            .query("SELECT 1 FROM dbo.Plans WHERE PlanName = @PlanName");

        if (dup.recordset.length) {
            return NextResponse.json({ ok: false, error: "Plan name already exists" }, { status: 409 });
        }

        const featuresJson = toDbJson(body.features);
        const docsJson = toDbJson(body.requiredDocuments || []);

        const insertReq = new sql.Request(pool)
            .input("PlanName", sql.NVarChar(100), body.planName)
            .input("Features", sql.NVarChar(sql.MAX), featuresJson)
            .input("JoiningFee", sql.Decimal(10,2), body.joiningFees)
            .input("SecurityDeposit", sql.Decimal(10,2), body.securityDeposit)
            .input("RequiredDocuments", sql.NVarChar(sql.MAX), docsJson);

        const result = await insertReq.query<PlanRow>(`
      INSERT INTO dbo.Plans (PlanName, Features, RequiredDocuments, JoiningFee, SecurityDeposit)
      OUTPUT INSERTED.PlanId, INSERTED.PlanName, INSERTED.Features, INSERTED.RequiredDocuments,  INSERTED.JoiningFee, INSERTED.SecurityDeposit, INSERTED.CreatedAt, INSERTED.UpdatedAt
      VALUES (@PlanName, @Features, @RequiredDocuments,  @JoiningFee, @SecurityDeposit);
    `);

        const row = result.recordset[0];

        return NextResponse.json({
            ok: true,
            data: {
                planId: row.PlanId,
                planName: row.PlanName,
                features: parseDbJson(row.Features),
                joiningFees: row.JoiningFee,
                securityDeposit: row.SecurityDeposit,
                requiredDocuments: parseDbJson<string[]>(row.RequiredDocuments) || [],
                createdAt: row.CreatedAt,
                updatedAt: row.UpdatedAt,
            },
        }, { status: 201 });
    } catch (err: any) {
        if (err?.issues) {
            return NextResponse.json({ ok: false, error: "Validation failed", details: err.issues }, { status: 422 });
        }
        console.error("POST /api/admin/plans error:", err);
        // Handle unique constraint generically
        return NextResponse.json({ ok: false, error: "Failed to create plan" }, { status: 500 });
    }
}
