import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";
import { z } from "zod";

/* -------------------- helpers -------------------- */
function parseDbJson<T = any>(val: any): T | undefined {
    if (val == null) return undefined;
    const s = String(val);
    if (!s.trim()) return undefined;
    try {
        return JSON.parse(s);
    } catch {
        return undefined as any;
    }
}
function toDbJson(val: any): string | null {
    if (val == null) return null;
    return JSON.stringify(val);
}

function rowToVehicle(row: any) {
    const plan =
        row.PlanName != null
            ? {
                planId: row.PlanId, // from Vehicles (FK)
                planName: row.PlanName as string,
                features:
                    row.P_Features != null
                        ? parseDbJson(row.P_Features)
                        : undefined,
                requiredDocuments:
                    row.P_RequiredDocuments != null
                        ? (parseDbJson<string[]>(row.P_RequiredDocuments) ?? [])
                        : undefined,
                joiningFees: row.P_JoiningFees != null,
                securityDeposit: row.P_SecurityDeposit != null,
                createdAt: row.P_CreatedAt
                    ? new Date(row.P_CreatedAt).toISOString()
                    : undefined,
                updatedAt: row.P_UpdatedAt
                    ? new Date(row.P_UpdatedAt).toISOString()
                    : undefined,
            }
            : undefined;

    return {
        vehicleId: row.VehicleId,
        planId: row.PlanId,
        plan, // <-- embedded plan

        uniqueCode: row.UniqueCode,
        model: row.Model,
        vinNumber: row.VinNumber,

        lastServiceDate: row.LastServiceDate
            ? new Date(row.LastServiceDate).toISOString().slice(0, 10)
            : null,
        serviceIntervalDays: row.ServiceIntervalDays ?? null,
        isServiceDue: !!row.IsServiceDue,

        status: row.Status as "Available" | "Rented",
        rentPerDay: Number(row.RentPerDay),
        quantity: row.Quantity != null ? Number(row.Quantity) : 1,

        vehicleImagesUrls:
            parseDbJson<string[]>(row.VehicleImagesURLs) ?? [],
        specs: parseDbJson(row.Specs),
        rating: row.Rating != null ? Number(row.Rating) : undefined,
        tags: parseDbJson<string[]>(row.Tags) ?? [],

        specs_RangeKm: row.Specs_RangeKm ?? undefined,
        specs_TopSpeedKmph: row.Specs_TopSpeedKmph ?? undefined,
        specs_Battery: row.Specs_Battery ?? undefined,
        specs_ChargingTimeHrs:
            row.Specs_ChargingTimeHrs != null
                ? Number(row.Specs_ChargingTimeHrs)
                : undefined,

        createdAt: row.CreatedAt
            ? new Date(row.CreatedAt).toISOString()
            : undefined,
        updatedAt: row.UpdatedAt
            ? new Date(row.UpdatedAt).toISOString()
            : undefined,
    };
}

/* -------------------- zod -------------------- */
const ListQuery = z.object({
    q: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    offset: z.coerce.number().int().min(0).optional().default(0),
});

const VehicleCreateSchema = z.object({
    planId: z.coerce.number().int().min(1),
    uniqueCode: z.string().min(1),
    model: z.string().min(1),
    vinNumber: z.string().min(1),
    status: z.enum(["Available", "Rented"]),
    rentPerDay: z.coerce.number().min(0),
    quantity: z.coerce.number().int().min(1).default(1),

    lastServiceDate: z.string().nullable().optional(), // yyyy-mm-dd
    serviceIntervalDays: z.coerce.number().int().min(0).nullable().optional(),

    vehicleImagesUrls: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    rating: z.coerce.number().min(0).max(5).optional(),

    specs: z
        .object({
            rangeKm: z.coerce.number().int().optional(),
            topSpeedKmph: z.coerce.number().int().optional(),
            battery: z.string().optional(),
            chargingTimeHrs: z.coerce.number().optional(),
        })
        .optional(),
});

/* -------------------- GET /api/v1/admin/vehicles -------------------- */
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
            r.input("Q", sql.NVarChar(200), `%${parsed.q}%`);
            where = `
        WHERE (
          v.UniqueCode LIKE @Q OR
          v.Model LIKE @Q OR
          v.VinNumber LIKE @Q OR
          v.Status LIKE @Q OR
          p.PlanName LIKE @Q
        )
      `;
        }

        const result = await r.query(`
            SELECT
                -- Vehicles
                v.VehicleId,
                v.PlanId,
                v.UniqueCode,
                v.Model,
                v.VinNumber,
                v.LastServiceDate,
                v.ServiceIntervalDays,
                v.IsServiceDue,
                v.Status,
                v.RentPerDay,
                v.VehicleImagesURLs,
                v.Specs,
                v.Rating,
                v.Tags,
                v.Specs_RangeKm,
                v.Specs_TopSpeedKmph,
                v.Specs_Battery,
                v.Specs_ChargingTimeHrs,
                v.Quantity,
                v.CreatedAt,
                v.UpdatedAt,

                -- Plan (joined)
                p.PlanName,
                p.Features          AS P_Features,
                p.RequiredDocuments AS P_RequiredDocuments,
                p.JoiningFee AS P_JoiningFees,
                p.SecurityDeposit AS P_SecurityDeposit,
                p.CreatedAt         AS P_CreatedAt,
                p.UpdatedAt         AS P_UpdatedAt

            FROM dbo.Vehicles v
                     LEFT JOIN dbo.Plans p
                               ON p.PlanId = v.PlanId
                ${where}
            ORDER BY v.VehicleId DESC
            OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
        `);

        const rows = (result.recordset || []).map(rowToVehicle);
        return NextResponse.json({ ok: true, data: rows });
    } catch (err: any) {
        console.error("GET /vehicles error:", err);
        return NextResponse.json(
            { ok: false, error: "Failed to list vehicles" },
            { status: 500 }
        );
    }
}


/* -------------------- POST /api/v1/admin/vehicles -------------------- */
export async function POST(req: NextRequest) {
    try {
        const body = VehicleCreateSchema.parse(await req.json());
        const pool = await getConnection();

        const imagesJson = toDbJson(body.vehicleImagesUrls ?? []);
        const tagsJson = toDbJson(body.tags ?? []);
        const specsJson = toDbJson(body.specs ?? null);

        const r = new sql.Request(pool);
        // r.timeout = 15000;

        r.input("PlanId", sql.Int, body.planId)
            .input("UniqueCode", sql.NVarChar(50), body.uniqueCode)
            .input("Model", sql.NVarChar(100), body.model)
            .input("VinNumber", sql.NVarChar(64), body.vinNumber)
            .input("LastServiceDate", sql.Date, body.lastServiceDate ?? null)
            .input("ServiceIntervalDays", sql.Int, body.serviceIntervalDays ?? null)
            .input("Status", sql.VarChar(10), body.status)
            .input("RentPerDay", sql.Decimal(10, 2), body.rentPerDay)
            .input("VehicleImagesURLs", sql.NVarChar(sql.MAX), imagesJson)
            .input("Specs", sql.NVarChar(sql.MAX), specsJson)
            .input("Rating", sql.Decimal(3, 2), body.rating ?? null)
            .input("Tags", sql.NVarChar(sql.MAX), tagsJson)
            .input("Quantity", sql.Int, body.quantity ?? 1);

        // INSERT + return new identity in the same batch
        const insertSql = `
      SET NOCOUNT ON;

      INSERT INTO dbo.Vehicles
        (PlanId, UniqueCode, Model, VinNumber, LastServiceDate, ServiceIntervalDays, Status, RentPerDay,
         VehicleImagesURLs, Specs, Rating, Tags, Quantity)
      VALUES
        (@PlanId, @UniqueCode, @Model, @VinNumber, @LastServiceDate, @ServiceIntervalDays, @Status, @RentPerDay,
         @VehicleImagesURLs, @Specs, @Rating, @Tags, @Quantity);

      SELECT CAST(SCOPE_IDENTITY() AS INT) AS NewId;
    `;

        const insertResult = await r.query<{ NewId: number }>(insertSql);
        const newId = insertResult.recordset?.[0]?.NewId;

        if (!newId) {
            return NextResponse.json({ ok: false, error: "Insert succeeded but id not returned" }, { status: 500 });
        }

        // Fetch the row separately
        const rs = await pool
            .request()
            .input("VehicleId", sql.Int, newId)
            .query(`SELECT * FROM dbo.Vehicles WHERE VehicleId = @VehicleId`);

        const row = rs.recordset?.[0];
        if (!row) {
            return NextResponse.json({ ok: false, error: "Created vehicle not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true, data: rowToVehicle(row) });
    } catch (err: any) {
        if (err?.issues) {
            return NextResponse.json(
                { ok: false, error: "Validation failed", details: err.issues },
                { status: 422 }
            );
        }
        console.error("POST /vehicles error:", err);
        return NextResponse.json({ ok: false, error: "Failed to create vehicle" }, { status: 500 });
    }
}
