import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";

// GET /api/v1/admin/alerts?type=&status=&page=1&pageSize=20&search=
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");      // e.g. RENTAL_OVERDUE | RENTAL_DUE_SOON | ...
        const status = searchParams.get("status");  // open | snoozed | closed
        const page = Math.max(1, Number(searchParams.get("page") || 1));
        const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));
        const search = (searchParams.get("search") || "").trim();

        const pool = await getConnection();
        const r = await pool.request()
            .input("type", sql.VarChar(32), type)
            .input("status", sql.VarChar(16), status)
            .input("offset", sql.Int, (page - 1) * pageSize)
            .input("limit", sql.Int, pageSize)
            .input("q", sql.NVarChar(100), search === "" ? null : `%${search}%`)
            .query(`
        WITH base AS (
          SELECT
            a.AlertId,
            a.Type,
            a.Message,
            a.DueDate,
            a.Status,
            a.CreatedAt,
            a.UpdatedAt,
            a.SnoozeUntil,                -- if this column exists in Alerts
            r.RentalId,                   -- ✅ fix: was r.RentId
            r.StartDate,
            r.ExpectedReturnDate,
            r.ActualReturnDate,
            r.Status AS RentalStatus,
            v.VehicleId,
            v.Model,
            v.UniqueCode,
            d.RiderId,
            d.FullName,
            d.Phone
          FROM dbo.Alerts a
          JOIN dbo.Rentals r ON r.RentalId = TRY_CAST(a.RelatedId AS BIGINT)
          JOIN dbo.Vehicles v ON v.VehicleId = r.VehicleId
          JOIN dbo.Riders   d ON d.RiderId   = r.RiderId
          WHERE (@type   IS NULL OR a.Type = @type)
            AND (@status IS NULL OR a.Status = @status)
            AND (
                 @q IS NULL OR
                 d.FullName LIKE @q OR
                 d.Phone    LIKE @q OR
                 v.Model    LIKE @q OR
                 v.UniqueCode LIKE @q
            )
        )
        SELECT
          *,
          COUNT(*) OVER() AS Total
        FROM base
        ORDER BY DueDate ASC, AlertId ASC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
      `);

        const rows = r.recordset;
        const total = rows.length ? Number(rows[0].Total) : 0;

        const data = rows.map((x: any) => ({
            alertId: Number(x.AlertId),
            type: x.Type,
            message: x.Message,
            dueDate: x.DueDate,
            status: x.Status,
            createdAt: x.CreatedAt,
            updatedAt: x.UpdatedAt,
            snoozeUntil: x.SnoozeUntil ?? null,
            rental: {
                rentalId: Number(x.RentalId),
                startDate: x.StartDate,
                expectedReturnDate: x.ExpectedReturnDate,
                actualReturnDate: x.ActualReturnDate,
                status: x.RentalStatus,
            },
            vehicle: {
                vehicleId: Number(x.VehicleId),
                model: x.Model,
                uniqueCode: x.UniqueCode,
            },
            rider: {
                riderId: Number(x.RiderId),
                fullName: x.FullName,
                phone: x.Phone,
            },
        }));

        return NextResponse.json({ ok: true, total, page, pageSize, data });
    } catch (err: any) {
        console.error("GET /api/v1/admin/alerts error:", err);
        return NextResponse.json({ ok: false, error: "Failed to load alerts" }, { status: 500 });
    }
}

// PATCH /api/v1/admin/alerts  -> { id, action: 'resolve' | 'reopen' | 'snooze', until?: ISO }
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const id = Number(body?.id);
        const action = String(body?.action || "");
        const until = body?.until ? new Date(body.until) : null;

        if (!id || !action) {
            return NextResponse.json({ ok: false, error: "Missing id/action" }, { status: 400 });
        }

        const pool = await getConnection();

        if (action === "resolve") {
            await pool.request()
                .input("id", sql.BigInt, id)
                .query(`UPDATE dbo.Alerts SET Status='closed', UpdatedAt=SYSUTCDATETIME(), SnoozeUntil=NULL WHERE AlertId=@id`);
        } else if (action === "reopen") {
            await pool.request()
                .input("id", sql.BigInt, id)
                .query(`UPDATE dbo.Alerts SET Status='open', UpdatedAt=SYSUTCDATETIME(), SnoozeUntil=NULL WHERE AlertId=@id`);
        } else if (action === "snooze") {
            if (!until) return NextResponse.json({ ok:false, error:"Missing 'until' for snooze" }, { status:400 });
            await pool.request()
                .input("id", sql.BigInt, id)
                .input("until", sql.DateTime2, until)
                .query(`UPDATE dbo.Alerts SET Status='snoozed', SnoozeUntil=@until, UpdatedAt=SYSUTCDATETIME() WHERE AlertId=@id`);
        } else {
            return NextResponse.json({ ok:false, error:"Unknown action" }, { status:400 });
        }

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("PATCH /api/v1/admin/alerts error:", err);
        return NextResponse.json({ ok: false, error: "Failed to update alert" }, { status: 500 });
    }
}
