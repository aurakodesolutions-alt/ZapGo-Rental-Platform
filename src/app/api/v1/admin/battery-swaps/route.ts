import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildUpiIntent(pa: string, am: number, opts?: { pn?: string; tn?: string }) {
    const params = new URLSearchParams();
    params.set("pa", pa.trim());       // payee VPA
    params.set("cu", "INR");
    params.set("am", String(am.toFixed(2)));
    if (opts?.pn) params.set("pn", opts.pn);
    if (opts?.tn) params.set("tn", opts.tn);
    return `upi://pay?${params.toString()}`;
}

/**
 * GET  /api/v1/admin/battery-swaps?from=&to=&q=&status=&page=&pageSize=
 * POST /api/v1/admin/battery-swaps  -> create swap + return UPI link
 */
export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;
        const page = Math.max(1, Number(sp.get("page") || 1));
        const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") || 20)));
        const offset = (page - 1) * pageSize;

        const status = (sp.get("status") || "").trim() || null; // pending|confirmed|canceled|null
        const q = (sp.get("q") || "").trim() || null;

        const toParam = sp.get("to");
        const fromParam = sp.get("from");
        const toDate = toParam ? new Date(toParam) : new Date();
        const fromDate = fromParam
            ? new Date(fromParam)
            : new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate() - 29));

        const pool = await getConnection();
        const r = await pool.request()
            .input("from", sql.Date, fromDate)
            .input("to", sql.Date, toDate)
            .input("status", sql.VarChar(12), status)
            .input("q", sql.NVarChar(120), q ? `%${q}%` : null)
            .input("offset", sql.Int, offset)
            .input("limit", sql.Int, pageSize)
            .query(`
        WITH base AS (
          SELECT
            s.SwapId, s.VehicleId, s.RentalId,
            v.UniqueCode, v.Model,
            s.Amount, s.OwnerUpiId, s.OwnerName, s.Note,
            s.PaymentStatus, s.PaymentConfirmedAt,
            s.OldBatterySerial, s.NewBatterySerial,
            s.OldBatteryPhotoUrl, s.NewBatteryPhotoUrl,
            s.CreatedAt, s.UpdatedAt, s.CompletedAt
          FROM dbo.BatterySwaps s
          JOIN dbo.Vehicles v ON v.VehicleId = s.VehicleId
          WHERE CONVERT(date, s.CreatedAt) >= @from
            AND CONVERT(date, s.CreatedAt) <= @to
            AND (@status IS NULL OR s.PaymentStatus = @status)
            AND (
              @q IS NULL OR
              v.UniqueCode LIKE @q OR v.Model LIKE @q OR s.OwnerUpiId LIKE @q
              OR CONVERT(nvarchar(50), s.SwapId) LIKE @q
            )
        )
        SELECT *, COUNT(*) OVER() AS Total
        FROM base
        ORDER BY CreatedAt DESC, SwapId DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
      `);

        const rows = r.recordset || [];
        const total = rows.length ? Number(rows[0].Total) : 0;

        const data = rows.map((x: any) => ({
            swapId: Number(x.SwapId),
            vehicle: { vehicleId: Number(x.VehicleId), uniqueCode: x.UniqueCode, model: x.Model },
            rentalId: x.RentalId ? Number(x.RentalId) : null,
            amount: Number(x.Amount),
            ownerUpiId: x.OwnerUpiId,
            ownerName: x.OwnerName || null,
            note: x.Note || null,
            paymentStatus: x.PaymentStatus,
            paymentConfirmedAt: x.PaymentConfirmedAt || null,
            oldBatterySerial: x.OldBatterySerial || null,
            newBatterySerial: x.NewBatterySerial || null,
            oldBatteryPhotoUrl: x.OldBatteryPhotoUrl || null,
            newBatteryPhotoUrl: x.NewBatteryPhotoUrl || null,
            createdAt: x.CreatedAt,
            updatedAt: x.UpdatedAt,
            completedAt: x.CompletedAt || null,
        }));

        return NextResponse.json({ ok: true, total, page, pageSize, data });
    } catch (err) {
        console.error("GET /battery-swaps error:", err);
        return NextResponse.json({ ok: false, error: "Failed to load battery swaps" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const vehicleId = Number(body?.vehicleId);
        const rentalId = body?.rentalId ? Number(body?.rentalId) : null;
        const amount = Number(body?.amount);
        const ownerUpiId = String(body?.ownerUpiId || "").trim();
        const ownerName = (body?.ownerName && String(body.ownerName).trim()) || null;
        const note = (body?.note && String(body.note).trim()) || "Battery Swap";

        if (!vehicleId || !amount || !ownerUpiId) {
            return NextResponse.json({ ok: false, error: "vehicleId, amount and ownerUpiId are required" }, { status: 400 });
        }

        const upiUrl = buildUpiIntent(ownerUpiId, amount, { pn: ownerName ?? undefined, tn: note });

        const pool = await getConnection();
        const q = await pool.request()
            .input("VehicleId", sql.BigInt, vehicleId)
            .input("RentalId", sql.BigInt, rentalId)
            .input("Amount", sql.Decimal(12,2), amount)
            .input("OwnerUpiId", sql.NVarChar(120), ownerUpiId)
            .input("OwnerName", sql.NVarChar(120), ownerName)
            .input("Note", sql.NVarChar(200), note)
            .input("UpiIntentUrl", sql.NVarChar(512), upiUrl)
            .query(`
        INSERT INTO dbo.BatterySwaps
          (VehicleId, RentalId, Amount, OwnerUpiId, OwnerName, Note, UpiIntentUrl, PaymentStatus, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.SwapId
        VALUES (@VehicleId, @RentalId, @Amount, @OwnerUpiId, @OwnerName, @Note, @UpiIntentUrl, 'pending', SYSUTCDATETIME(), SYSUTCDATETIME());
      `);

        const swapId = Number(q.recordset[0].SwapId);
        const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}`;

        return NextResponse.json({ ok: true, data: { swapId, upiUrl, qrImage } });
    } catch (err) {
        console.error("POST /battery-swaps error:", err);
        return NextResponse.json({ ok: false, error: "Failed to create swap" }, { status: 500 });
    }
}
