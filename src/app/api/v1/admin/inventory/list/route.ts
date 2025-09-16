import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Q = z.object({
    types: z.string().optional(), // CSV e.g. "BATTERY,CHARGER"
    availableOnly: z.coerce.boolean().optional().default(true),
    limit: z.coerce.number().int().min(1).max(200).default(100),
    offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const qp = Q.parse({
            types: searchParams.get("types") || undefined,
            availableOnly: searchParams.get("availableOnly") ?? "1",
            limit: searchParams.get("limit") ?? "100",
            offset: searchParams.get("offset") ?? "0",
        });

        const pool = await getConnection();
        const r = new sql.Request(pool)
            .input("Limit", sql.Int, qp.limit)
            .input("Offset", sql.Int, qp.offset);

        const where: string[] = [];

        if (qp.types) {
            const arr = qp.types.split(",").map(s => s.trim()).filter(Boolean);
            if (arr.length) {
                // create a TVP-like OR list
                const params = arr.map((t, i) => {
                    r.input(`T${i}`, sql.VarChar(20), t.toUpperCase());
                    return `@T${i}`;
                }).join(",");
                where.push(`mi.ItemType IN (${params})`);
            }
        }

        if (qp.availableOnly) {
            where.push("(mi.AssignedRentalId IS NULL AND mi.Status='InStock')");
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

        const q = `
      SELECT mi.ItemId, mi.ItemType, mi.SerialNumber, mi.Status, mi.AssignedRentalId, mi.Notes
      FROM dbo.MiscInventory mi
      ${whereSql}
      ORDER BY mi.ItemType ASC, mi.ItemId DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;
        const rs = await r.query(q);

        return NextResponse.json({
            ok: true,
            data: rs.recordset.map((row: any) => ({
                itemId: Number(row.ItemId),
                itemType: row.ItemType,
                serialNumber: row.SerialNumber,
                status: row.Status,
                assignedRentalId: row.AssignedRentalId ?? null,
                notes: row.Notes ?? null,
            })),
        });
    } catch (e) {
        console.error("GET /admin/inventory/list error:", e);
        return NextResponse.json({ ok: false, error: "Failed to load accessories" }, { status: 500 });
    }
}
