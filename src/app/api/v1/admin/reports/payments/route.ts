import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/reports/payments?from=&to=&method=&status=&q=&page=1&pageSize=20
 * Filters by TransactionDate within [from, to] inclusive.
 */
export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;

        const page = Math.max(1, Number(sp.get("page") || 1));
        const pageSize = Math.min(200, Math.max(1, Number(sp.get("pageSize") || 20)));
        const offset = (page - 1) * pageSize;

        const method = (sp.get("method") || "").trim(); // CASH|CARD|UPI|BANK...
        const status = (sp.get("status") || "").trim(); // SUCCESS|FAILED|PENDING...
        const q = (sp.get("q") || "").trim();

        // date window (inclusive)
        const toParam = sp.get("to");
        const fromParam = sp.get("from");
        const toDate = toParam ? new Date(toParam) : new Date();
        const fromDate = fromParam ? new Date(fromParam) : new Date(Date.UTC(
            toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate() - 29
        ));
        const endExclusive = new Date(toDate);
        endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

        const pool = await getConnection();
        const reqDb = pool.request()
            .input("from", sql.Date, fromDate)
            .input("endExclusive", sql.Date, endExclusive)
            .input("offset", sql.Int, offset)
            .input("limit", sql.Int, pageSize);

        let where = `
      p.TransactionDate >= @from
      AND p.TransactionDate < @endExclusive
    `;

        if (method) {
            reqDb.input("method", sql.VarChar(20), method);
            where += ` AND p.PaymentMethod = @method`;
        }
        if (status) {
            reqDb.input("pstatus", sql.VarChar(12), status);
            where += ` AND p.TransactionStatus = @pstatus`;
        }
        if (q) {
            reqDb.input("q", sql.NVarChar(256), `%${q}%`);
            where += `
        AND (
          d.FullName LIKE @q OR d.Phone LIKE @q
          OR p.TxnRef LIKE @q
          OR CONVERT(nvarchar(50), p.RentalId) LIKE @q
        )
      `;
        }

        const sqlText = `
      WITH base AS (
        SELECT
          p.PaymentId, p.RentalId, p.RiderId,
          p.Amount, p.PaymentMethod, p.TxnRef,
          p.TransactionStatus, p.TransactionDate,
          d.FullName, d.Phone
        FROM Payments p
        JOIN Riders d ON d.RiderId = p.RiderId
        WHERE ${where}
      ),
      numbered AS (
        SELECT *,
               ROW_NUMBER() OVER (ORDER BY TransactionDate DESC, PaymentId DESC) AS rn,
               COUNT(*)     OVER () AS Total
        FROM base
      )
      SELECT * FROM numbered
      WHERE rn > @offset AND rn <= (@offset + @limit)
      ORDER BY rn;
    `;

        const rs = await reqDb.query(sqlText);
        const total = rs.recordset.length ? Number(rs.recordset[0].Total) : 0;

        const data = rs.recordset.map((p: any) => ({
            paymentId: Number(p.PaymentId),
            rentalId: Number(p.RentalId),
            rider: { riderId: Number(p.RiderId), fullName: p.FullName, phone: p.Phone },
            amount: Number(p.Amount || 0),
            paymentMethod: String(p.PaymentMethod || ""),
            txnRef: p.TxnRef || null,
            transactionStatus: String(p.TransactionStatus || ""),
            transactionDate: p.TransactionDate,
        }));

        return NextResponse.json({ ok: true, total, page, pageSize, data });
    } catch (err) {
        console.error("GET /reports/payments error:", err);
        return NextResponse.json({ ok:false, error:"Failed to load payments" }, { status: 500 });
    }
}
