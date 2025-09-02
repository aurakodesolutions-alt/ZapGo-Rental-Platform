import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";

function toStringArray(input: unknown): string[] {
    if (!input) return [];
    if (Array.isArray(input)) return input.map(String).filter(Boolean);
    const raw = String(input).trim();
    if (!raw) return [];
    // Try JSON first
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
        // not JSON, treat as CSV
    }
    return raw
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(24, Math.max(1, Number(searchParams.get("pageSize") || 6)));
    const planId = searchParams.get("planId");
    const offset = (page - 1) * pageSize;

    const pool = await getConnection();

    const where = `
    WHERE v.Quantity > 0
      ${planId ? "AND v.PlanId = @planId" : ""}
  `;

    const itemsQ = `
    SELECT
      v.VehicleId,
      v.Model,
      v.RentPerDay,
      v.VehicleImagesURLs,
      v.Quantity,
      v.PlanId,
      p.PlanName
    FROM Vehicles v
    LEFT JOIN Plans p ON p.PlanId = v.PlanId
    ${where}
    ORDER BY v.VehicleId DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
  `;

    const countQ = `
    SELECT COUNT(1) AS total
    FROM Vehicles v
    ${where};
  `;

    const itemsReq = pool
        .request()
        .input("offset", sql.Int, offset)
        .input("pageSize", sql.Int, pageSize);
    if (planId) itemsReq.input("planId", sql.Int, Number(planId));

    const countReq = pool.request();
    if (planId) countReq.input("planId", sql.Int, Number(planId));

    const [itemsR, countR] = await Promise.all([itemsReq.query(itemsQ), countReq.query(countQ)]);

    const items = itemsR.recordset.map((x: any) => {
        const urls = toStringArray(x.VehicleImagesURLs);
        return {
            id: Number(x.VehicleId),
            model: x.Model,
            vehicleImagesUrls: urls,         // canonical
            images: urls,                    // backward compatibility
            rentPerDay: Number(x.RentPerDay || 0),
            planId: Number(x.PlanId),
            planName: x.PlanName,
            quantity: Number(x.Quantity || 0),
            remaining: Number(x.Quantity || 0),
        };
    });

    return NextResponse.json({
        items,
        total: countR.recordset[0]?.total ?? 0,
    });
}
