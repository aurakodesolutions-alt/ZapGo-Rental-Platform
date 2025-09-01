// src/app/api/v1/admin/vehicles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";
import { VehicleUpdateSchema } from "@/lib/schema";
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
    return {
        vehicleId: row.VehicleId,
        planId: row.PlanId,
        uniqueCode: row.UniqueCode,
        model: row.Model,
        vinNumber: row.VinNumber,
        lastServiceDate: row.LastServiceDate ? new Date(row.LastServiceDate).toISOString().slice(0, 10) : null,
        serviceIntervalDays: row.ServiceIntervalDays ?? null,
        isServiceDue: !!row.IsServiceDue,
        status: row.Status as "Available" | "Rented",
        rentPerDay: row.RentPerDay != null ? Number(row.RentPerDay) : 0,
        vehicleImagesUrls: parseDbJson<string[]>(row.VehicleImagesURLs) ?? [],
        specs: parseDbJson(row.Specs),
        rating: row.Rating != null ? Number(row.Rating) : undefined,
        tags: parseDbJson<string[]>(row.Tags) ?? [],
        specs_RangeKm: row.Specs_RangeKm ?? undefined,
        specs_TopSpeedKmph: row.Specs_TopSpeedKmph ?? undefined,
        specs_Battery: row.Specs_Battery ?? undefined,
        specs_ChargingTimeHrs: row.Specs_ChargingTimeHrs != null ? Number(row.Specs_ChargingTimeHrs) : undefined,
        quantity: row.Quantity != null ? Number(row.Quantity) : 1,
        createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : undefined,
        updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : undefined,
    };
}

/* -------------------- zod -------------------- */
const IdSchema = z.object({ id: z.coerce.number().int().min(1) });


/* -------------------- GET /api/v1/admin/vehicles/:id -------------------- */
export async function GET(
    _req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const id = Number((await (props.params)).id);
        const parsed = IdSchema.parse({ id });

        const pool = await getConnection();
        const r = new sql.Request(pool).input("VehicleId", sql.BigInt, parsed.id);
        const result = await r.query(`SELECT * FROM dbo.Vehicles WHERE VehicleId = @VehicleId;`);
        const row = result.recordset?.[0];
        if (!row) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

        return NextResponse.json({ ok: true, data: rowToVehicle(row) });
    } catch (err: any) {
        console.error("GET /vehicles/:id error:", err);
        return NextResponse.json({ ok: false, error: "Failed to fetch vehicle" }, { status: 500 });
    }
}

/* -------------------- PUT /api/v1/admin/vehicles/:id -------------------- */
export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const vehicleId = IdSchema.parse({ id }).id;
        const body = VehicleUpdateSchema.parse(await req.json());

        const pool = await getConnection();

        // Ensure exists
        const exists = await new sql.Request(pool)
            .input("VehicleId", sql.BigInt, vehicleId)
            .query(`SELECT 1 FROM dbo.Vehicles WHERE VehicleId = @VehicleId;`);
        if (!exists.recordset.length) {
            return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        }

        const sets: string[] = [];
        const r = new sql.Request(pool).input("VehicleId", sql.BigInt, vehicleId);

        // Each field handled explicitly (keeps TS happy with mssql types)
        if (body.planId !== undefined) {
            sets.push("PlanId = @PlanId");
            r.input("PlanId", sql.Int, body.planId);
        }
        if (body.uniqueCode !== undefined) {
            sets.push("UniqueCode = @UniqueCode");
            r.input("UniqueCode", sql.NVarChar(50), body.uniqueCode);
        }
        if (body.model !== undefined) {
            sets.push("Model = @Model");
            r.input("Model", sql.NVarChar(100), body.model);
        }
        if (body.vinNumber !== undefined) {
            sets.push("VinNumber = @VinNumber");
            r.input("VinNumber", sql.NVarChar(64), body.vinNumber);
        }
        if (body.lastServiceDate !== undefined) {
            sets.push("LastServiceDate = @LastServiceDate");
            r.input("LastServiceDate", sql.Date, body.lastServiceDate ?? null);
        }
        if (body.serviceIntervalDays !== undefined) {
            sets.push("ServiceIntervalDays = @ServiceIntervalDays");
            r.input("ServiceIntervalDays", sql.Int, body.serviceIntervalDays ?? null);
        }
        if (body.status !== undefined) {
            sets.push("Status = @Status");
            r.input("Status", sql.VarChar(10), body.status);
        }
        if (body.rentPerDay !== undefined) {
            sets.push("RentPerDay = @RentPerDay");
            r.input("RentPerDay", sql.Decimal(10, 2), body.rentPerDay);
        }
        if (body.quantity !== undefined) {
            sets.push("Quantity = @Quantity");
            r.input("Quantity", sql.Int, body.quantity);
        }

        if (body.vehicleImagesUrls !== undefined) {
            sets.push("VehicleImagesURLs = @VehicleImagesURLs");
            r.input("VehicleImagesURLs", sql.NVarChar(sql.MAX), toDbJson(body.vehicleImagesUrls ?? []));
        }

        if (body.specs !== undefined) {
            sets.push("Specs = @Specs");
            r.input("Specs", sql.NVarChar(sql.MAX), toDbJson(body.specs ?? null));

            if ("rangeKm" in (body.specs || {})) {
                sets.push("Specs_RangeKm = @Specs_RangeKm");
                r.input("Specs_RangeKm", sql.Int, body.specs?.rangeKm ?? null);
            }
            if ("topSpeedKmph" in (body.specs || {})) {
                sets.push("Specs_TopSpeedKmph = @Specs_TopSpeedKmph");
                r.input("Specs_TopSpeedKmph", sql.Int, body.specs?.topSpeedKmph ?? null);
            }
            if ("battery" in (body.specs || {})) {
                sets.push("Specs_Battery = @Specs_Battery");
                r.input("Specs_Battery", sql.NVarChar(4000), body.specs?.battery ?? null);
            }
            if ("chargingTimeHrs" in (body.specs || {})) {
                sets.push("Specs_ChargingTimeHrs = @Specs_ChargingTimeHrs");
                r.input("Specs_ChargingTimeHrs", sql.Decimal(5, 2), body.specs?.chargingTimeHrs ?? null);
            }
        }

        if (body.rating !== undefined) {
            sets.push("Rating = @Rating");
            r.input("Rating", sql.Decimal(3, 2), body.rating ?? null);
        }

        if (body.tags !== undefined) {
            sets.push("Tags = @Tags");
            r.input("Tags", sql.NVarChar(sql.MAX), toDbJson(body.tags ?? []));
        }

        if (sets.length === 0) {
            // nothing to update; re-read and return
            const out = await new sql.Request(pool)
                .input("VehicleId", sql.BigInt, vehicleId)
                .query(`SELECT * FROM dbo.Vehicles WHERE VehicleId = @VehicleId;`);
            return NextResponse.json({ ok: true, data: rowToVehicle(out.recordset[0]) });
        }

        await r.query(`
            UPDATE dbo.Vehicles
            SET ${sets.join(", ")}
            WHERE VehicleId = @VehicleId;
        `);

        // Re-read row (avoid OUTPUT due to triggers)
        const out = await new sql.Request(pool)
            .input("VehicleId", sql.BigInt, vehicleId)
            .query(`SELECT * FROM dbo.Vehicles WHERE VehicleId = @VehicleId;`);

        const row = out.recordset?.[0];
        if (!row) return NextResponse.json({ ok: false, error: "Not found after update" }, { status: 404 });

        return NextResponse.json({ ok: true, data: rowToVehicle(row) });
    } catch (err: any) {
        if (err?.issues) {
            return NextResponse.json({ ok: false, error: "Validation failed", details: err.issues }, { status: 422 });
        }
        console.error("PUT /vehicles/:id error:", err);
        return NextResponse.json({ ok: false, error: "Failed to update vehicle" }, { status: 500 });
    }
}

/* -------------------- DELETE /api/v1/admin/vehicles/:id -------------------- */
export async function DELETE(
    _req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const vehicleId = IdSchema.parse({ id }).id;

        const pool = await getConnection();

        const check = await new sql.Request(pool)
            .input("VehicleId", sql.BigInt, vehicleId)
            .query(`SELECT 1 FROM dbo.Vehicles WHERE VehicleId = @VehicleId;`);
        if (!check.recordset.length) {
            return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        }

        await new sql.Request(pool)
            .input("VehicleId", sql.BigInt, vehicleId)
            .query(`DELETE FROM dbo.Vehicles WHERE VehicleId = @VehicleId;`);

        return NextResponse.json({ ok: true, data: null });
    } catch (err: any) {
        console.error("DELETE /vehicles/:id error:", err);
        return NextResponse.json({ ok: false, error: "Failed to delete vehicle" }, { status: 500 });
    }
}
