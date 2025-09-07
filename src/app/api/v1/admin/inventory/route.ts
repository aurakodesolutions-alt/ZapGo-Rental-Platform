// app/api/v1/admin/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ItemTypes = ["Battery","Charger","Controller","Converter","Motor"] as const;
const Statuses  = ["InStock","Assigned","Damaged","Retired","Lost"] as const;

const CreateSchema = z.object({
    itemType: z.enum(ItemTypes),
    serialNumber: z.string().min(1),
    status: z.enum(Statuses).default("InStock"),
    assignedRentalId: z.coerce.number().int().positive().optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
});

export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;
        const q       = (sp.get("q") || "").trim();
        const type    = (sp.get("type") || "").trim();
        const status  = (sp.get("status") || "").trim();
        const limit   = Math.max(1, Math.min(Number(sp.get("limit") || 100), 500));
        const offset  = Math.max(0, Number(sp.get("offset") || 0));
        const format  = (sp.get("format") || "json").toLowerCase();

        const pool = await getConnection();
        const r = new sql.Request(pool);

        r.input("limit", sql.Int, limit);
        r.input("offset", sql.Int, offset);

        let where = "1=1";
        if (q) {
            r.input("q", sql.NVarChar(256), `%${q}%`);
            where += ` AND (mi.SerialNumber LIKE @q OR mi.Notes LIKE @q OR CONVERT(nvarchar(50), mi.ItemId) LIKE @q)`;
        }
        if (type) {
            r.input("type", sql.VarChar(20), type);
            where += ` AND mi.ItemType=@type`;
        }
        if (status) {
            r.input("status", sql.VarChar(20), status);
            where += ` AND mi.Status=@status`;
        }

        const sqlText = `
      SELECT
        mi.ItemId, mi.ItemType, mi.SerialNumber, mi.Status,
        mi.AssignedRentalId, mi.Notes, mi.CreatedAt, mi.UpdatedAt,
        r.RiderId, rd.FullName, rd.Phone
      FROM MiscInventory mi
      LEFT JOIN Rentals r ON r.RentalId = mi.AssignedRentalId
      LEFT JOIN Riders  rd ON rd.RiderId = r.RiderId
      WHERE ${where}
      ORDER BY mi.UpdatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

        const res = await r.query(sqlText);
        const rows = res.recordset.map((x: any) => ({
            itemId: Number(x.ItemId),
            itemType: String(x.ItemType),
            serialNumber: x.SerialNumber,
            status: String(x.Status),
            assignedRentalId: x.AssignedRentalId === null ? null : Number(x.AssignedRentalId),
            notes: x.Notes ?? null,
            createdAt: x.CreatedAt,
            updatedAt: x.UpdatedAt,
            rider: x.RiderId ? { riderId: Number(x.RiderId), fullName: x.FullName, phone: x.Phone } : null,
        }));

        if (format === "csv") {
            const header = "ItemId,ItemType,SerialNumber,Status,AssignedRentalId,Notes,CreatedAt,UpdatedAt";
            const csv = [
                header,
                ...rows.map(r =>
                    [
                        r.itemId,
                        r.itemType,
                        JSON.stringify(r.serialNumber),
                        r.status,
                        r.assignedRentalId ?? "",
                        JSON.stringify(r.notes ?? ""),
                        r.createdAt,
                        r.updatedAt,
                    ].join(",")
                ),
            ].join("\n");

            return new NextResponse(csv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="misc_inventory.csv"`,
                },
            });
        }

        return NextResponse.json({ ok: true, data: rows });
    } catch (err) {
        console.error("GET /admin/inventory error", err);
        return NextResponse.json({ ok: false, error: "Failed to load inventory" }, { status: 400 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Allow single item or array
        const items = Array.isArray(body) ? body : [body];
        const parsed = items.map((i) => CreateSchema.parse(i));

        const pool = await getConnection();
        const trx = new sql.Transaction(pool);
        await trx.begin();

        try {
            const out: any[] = [];
            for (const it of parsed) {
                const r = new sql.Request(trx);
                r.input("type", sql.VarChar(20), it.itemType);
                r.input("sn", sql.NVarChar(100), it.serialNumber);
                r.input("status", sql.VarChar(20), it.status);
                r.input("rid", sql.BigInt, it.assignedRentalId ?? null);
                r.input("notes", sql.NVarChar(1000), it.notes ?? null);

                const q = await r.query(`
          INSERT INTO MiscInventory (ItemType, SerialNumber, Status, AssignedRentalId, Notes, CreatedAt, UpdatedAt)
          OUTPUT INSERTED.ItemId
          VALUES (@type, @sn, @status, @rid, @notes, SYSUTCDATETIME(), SYSUTCDATETIME());
        `);
                out.push({ itemId: Number(q.recordset[0].ItemId) });
            }

            await trx.commit();
            return NextResponse.json({ ok: true, data: out });
        } catch (e: any) {
            await trx.rollback();
            // Unique violation for SerialNumber
            if (e && (e.number === 2627 || e.number === 2601)) {
                return NextResponse.json({ ok: false, error: "Serial number already exists" }, { status: 409 });
            }
            throw e;
        }
    } catch (err) {
        console.error("POST /admin/inventory error", err);
        return NextResponse.json({ ok: false, error: "Create failed" }, { status: 400 });
    }
}
