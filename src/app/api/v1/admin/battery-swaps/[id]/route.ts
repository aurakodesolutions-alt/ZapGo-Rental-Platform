import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (!id) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

        const pool = await getConnection();
        const r = await pool.request()
            .input("id", sql.BigInt, id)
            .query(`
        SELECT s.*, v.UniqueCode, v.Model
        FROM dbo.BatterySwaps s
        JOIN dbo.Vehicles v ON v.VehicleId = s.VehicleId
        WHERE s.SwapId = @id
      `);

        const row = r.recordset[0];
        if (!row) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

        return NextResponse.json({
            ok: true,
            data: {
                swapId: Number(row.SwapId),
                vehicle: { vehicleId: Number(row.VehicleId), uniqueCode: row.UniqueCode, model: row.Model },
                rentalId: row.RentalId ? Number(row.RentalId) : null,
                amount: Number(row.Amount),
                ownerUpiId: row.OwnerUpiId,
                ownerName: row.OwnerName || null,
                note: row.Note || null,
                upiUrl: row.UpiIntentUrl,
                paymentStatus: row.PaymentStatus,
                paymentConfirmedAt: row.PaymentConfirmedAt || null,
                oldBatterySerial: row.OldBatterySerial || null,
                newBatterySerial: row.NewBatterySerial || null,
                oldBatteryPhotoUrl: row.OldBatteryPhotoUrl || null,
                newBatteryPhotoUrl: row.NewBatteryPhotoUrl || null,
                createdAt: row.CreatedAt, updatedAt: row.UpdatedAt, completedAt: row.CompletedAt || null,
            }
        });
    } catch (err) {
        console.error("GET /battery-swaps/[id] error:", err);
        return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
    }
}

/**
 * PATCH /api/v1/admin/battery-swaps/:id
 * { action: 'confirm_payment' | 'update' | 'complete', oldSerial?, newSerial?, notes? }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (!id) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

        const body = await req.json().catch(() => ({}));
        const action = String(body?.action || "");

        const pool = await getConnection();
        const q = pool.request().input("id", sql.BigInt, id);

        if (action === "confirm_payment") {
            await q.query(`
        UPDATE dbo.BatterySwaps
        SET PaymentStatus='confirmed', PaymentConfirmedAt=SYSUTCDATETIME(), UpdatedAt=SYSUTCDATETIME()
        WHERE SwapId=@id
      `);
            return NextResponse.json({ ok: true });
        }

        if (action === "update") {
            const oldSerial = body?.oldSerial ? String(body.oldSerial).trim() : null;
            const newSerial = body?.newSerial ? String(body.newSerial).trim() : null;
            const note = body?.note ? String(body.note).trim() : null;

            await pool.request()
                .input("id", sql.BigInt, id)
                .input("OldBatterySerial", sql.NVarChar(100), oldSerial)
                .input("NewBatterySerial", sql.NVarChar(100), newSerial)
                .input("Note", sql.NVarChar(200), note)
                .query(`
          UPDATE dbo.BatterySwaps
          SET OldBatterySerial = COALESCE(@OldBatterySerial, OldBatterySerial),
              NewBatterySerial = COALESCE(@NewBatterySerial, NewBatterySerial),
              Note = COALESCE(@Note, Note),
              UpdatedAt = SYSUTCDATETIME()
          WHERE SwapId=@id
        `);
            return NextResponse.json({ ok: true });
        }

        if (action === "complete") {
            await q.query(`
        UPDATE dbo.BatterySwaps
        SET CompletedAt=SYSUTCDATETIME(), UpdatedAt=SYSUTCDATETIME()
        WHERE SwapId=@id
      `);
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
    } catch (err) {
        console.error("PATCH /battery-swaps/[id] error:", err);
        return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
    }
}
