// app/api/v1/admin/inventory/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ItemTypes = ["Battery","Charger","Controller","Converter","Motor"] as const;
const Statuses  = ["InStock","Assigned","Damaged","Retired","Lost"] as const;

const UpdateSchema = z.object({
    itemType: z.enum(ItemTypes).optional(),
    serialNumber: z.string().min(1).optional(),
    status: z.enum(Statuses).optional(),
    assignedRentalId: z.coerce.number().int().positive().nullable().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
});

export async function PATCH(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await _.json();
        const data = UpdateSchema.parse(body);
        const id = Number(params.id);

        const sets: string[] = [];
        const req = new sql.Request(await getConnection());

        req.input("id", sql.BigInt, id);
        if (data.itemType !== undefined)        { sets.push("ItemType=@type"); req.input("type", sql.VarChar(20), data.itemType); }
        if (data.serialNumber !== undefined)    { sets.push("SerialNumber=@sn"); req.input("sn", sql.NVarChar(100), data.serialNumber); }
        if (data.status !== undefined)          { sets.push("Status=@status"); req.input("status", sql.VarChar(20), data.status); }
        if (data.assignedRentalId !== undefined){ sets.push("AssignedRentalId=@rid"); req.input("rid", sql.BigInt, data.assignedRentalId ?? null); }
        if (data.notes !== undefined)           { sets.push("Notes=@notes"); req.input("notes", sql.NVarChar(1000), data.notes ?? null); }

        if (!sets.length) return NextResponse.json({ ok: true, data: { updated: 0 } });

        const sqlText = `
      UPDATE MiscInventory
      SET ${sets.join(", ")}, UpdatedAt=SYSUTCDATETIME()
      WHERE ItemId=@id;

      SELECT
        mi.ItemId, mi.ItemType, mi.SerialNumber, mi.Status, mi.AssignedRentalId, mi.Notes, mi.CreatedAt, mi.UpdatedAt
      FROM MiscInventory mi
      WHERE mi.ItemId=@id;
    `;

        try {
            const res = await req.query(sqlText);
            if (!res.recordset.length) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

            const r = res.recordset[0];
            return NextResponse.json({
                ok: true,
                data: {
                    itemId: Number(r.ItemId),
                    itemType: r.ItemType,
                    serialNumber: r.SerialNumber,
                    status: r.Status,
                    assignedRentalId: r.AssignedRentalId === null ? null : Number(r.AssignedRentalId),
                    notes: r.Notes ?? null,
                    createdAt: r.CreatedAt,
                    updatedAt: r.UpdatedAt,
                },
            });
        } catch (e: any) {
            if (e && (e.number === 2627 || e.number === 2601)) {
                return NextResponse.json({ ok: false, error: "Serial number already exists" }, { status: 409 });
            }
            throw e;
        }
    } catch (err) {
        console.error("PATCH /admin/inventory/:id error", err);
        return NextResponse.json({ ok: false, error: "Update failed" }, { status: 400 });
    }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        const req = new sql.Request(await getConnection());
        req.input("id", sql.BigInt, id);
        const res = await req.query(`DELETE FROM MiscInventory WHERE ItemId=@id; SELECT @@ROWCOUNT AS rc;`);
        return NextResponse.json({ ok: true, data: { deleted: Number(res.recordset?.[0]?.rc ?? 0) } });
    } catch (err) {
        console.error("DELETE /admin/inventory/:id error", err);
        return NextResponse.json({ ok: false, error: "Delete failed" }, { status: 400 });
    }
}
