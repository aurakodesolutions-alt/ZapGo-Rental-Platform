// app/api/v1/public/vehicles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";

/** CSV/JSON string -> string[] */
function toStringArray(input: unknown): string[] {
    if (!input) return [];
    if (Array.isArray(input)) return input.map(String).filter(Boolean);
    const raw = String(input).trim();
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
        // not JSON; treat as CSV
    }
    return raw
        .split(/[,|]\s*/g)
        .map((x) => x.trim())
        .filter(Boolean);
}

/** CSV/JSON urls -> string[] */
function toUrlArray(input: unknown): string[] {
    return toStringArray(input);
}

export async function GET(
    _req: NextRequest,
    ctx: { params: { id: string } }
) {
    const idNum = Number(ctx.params?.id);
    if (!idNum || Number.isNaN(idNum)) {
        return NextResponse.json({ error: "Invalid vehicle id" }, { status: 400 });
    }

    const pool = await getConnection();

    // Columns align with your Vehicle type. If your schema uses slightly different names,
    // adjust aliases below to keep the API stable for the frontend.
    const q = `
    SELECT TOP 1
      v.VehicleId,
      v.UniqueCode,
      v.Model,
      v.VinNumber,               -- VINNumber/VinNumber, case-insensitive in SQL Server
      v.LastServiceDate,
      v.ServiceIntervalDays,
      v.Status,
      v.RentPerDay,
      v.Quantity,
      v.VehicleImagesURLs,       -- CSV or JSON array of URLs
      v.Specs_RangeKm,
      v.Specs_TopSpeedKmph,
      v.Specs_Battery,
      v.Specs_ChargingTimeHrs,
      v.Rating,
      v.Tags,                    -- CSV or JSON tags
      v.CreatedAt,
      v.UpdatedAt,
      p.PlanId,
      p.PlanName,
      p.JoiningFee,
      p.SecurityDeposit,
      p.RequiredDocuments,
      p.Features                 -- optional CSV/JSON features on the plan
    FROM Vehicles v
    LEFT JOIN Plans p ON p.PlanId = v.PlanId
    WHERE v.VehicleId = @id
  `;

    const r = await pool.request().input("id", sql.Int, idNum).query(q);
    if (!r.recordset.length) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const x = r.recordset[0];

    // Compute service due
    let isServiceDue = false;
    if (x.LastServiceDate && x.ServiceIntervalDays) {
        const last = new Date(x.LastServiceDate);
        const due = new Date(last);
        due.setDate(due.getDate() + Number(x.ServiceIntervalDays || 0));
        isServiceDue = Number.isFinite(due.getTime()) && Date.now() >= +due;
    }

    // Normalize media & tags
    const images = toUrlArray(x.VehicleImagesURLs);
    const tags = toStringArray(x.Tags);

    // Optional plan object (kept small for card/drawer)
    const plan =
        x.PlanId != null
            ? {
                id: Number(x.PlanId),
                name: x.PlanName as string,
                joiningFee: Number(x.JoiningFee || 0),
                securityDeposit: Number(x.SecurityDeposit || 0),
                requiredDocuments: x.RequiredDocuments as string | null,
                features: toStringArray(x.Features),
            }
            : undefined;

    const vehicle = {
        // Required
        id: Number(x.VehicleId),
        planId: Number(x.PlanId),
        plan,

        // Identity
        uniqueCode: x.UniqueCode ?? "",
        model: x.Model ?? "Scooter",
        vinNumber: x.VinNumber ?? "",

        // Maintenance
        lastServiceDate: x.LastServiceDate ? new Date(x.LastServiceDate).toISOString() : null,
        serviceIntervalDays: x.ServiceIntervalDays != null ? Number(x.ServiceIntervalDays) : null,
        isServiceDue,

        // Rental status
        status: String(x.Status || "ACTIVE"),
        rentPerDay: Number(x.RentPerDay || 0),
        quantity: Number(x.Quantity || 0),

        // Media
        vehicleImagesUrls: images,

        // Specs (nested + flat fields for convenience)
        specs: {
            rangeKm: x.Specs_RangeKm != null ? Number(x.Specs_RangeKm) : undefined,
            topSpeedKmph: x.Specs_TopSpeedKmph != null ? Number(x.Specs_TopSpeedKmph) : undefined,
            battery: x.Specs_Battery ?? undefined,
            chargingTimeHrs:
                x.Specs_ChargingTimeHrs != null ? Number(x.Specs_ChargingTimeHrs) : undefined,
        },
        specs_RangeKm: x.Specs_RangeKm != null ? Number(x.Specs_RangeKm) : undefined,
        specs_TopSpeedKmph:
            x.Specs_TopSpeedKmph != null ? Number(x.Specs_TopSpeedKmph) : undefined,
        specs_Battery: x.Specs_Battery ?? undefined,
        specs_ChargingTimeHrs:
            x.Specs_ChargingTimeHrs != null ? Number(x.Specs_ChargingTimeHrs) : undefined,

        // Misc
        rating: x.Rating != null ? Number(x.Rating) : undefined,
        tags,

        // Metadata (fallback to ISO now if columns are missing/null)
        createdAt: x.CreatedAt ? new Date(x.CreatedAt).toISOString() : new Date().toISOString(),
        updatedAt: x.UpdatedAt ? new Date(x.UpdatedAt).toISOString() : new Date().toISOString(),
    };

    return NextResponse.json(vehicle);
}
