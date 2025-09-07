import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/payments
 *   ?q=<search>
 *   &method=<CASH|UPI|CARD|CASHFREE>
 *   &status=<SUCCESS|FAILED|PENDING>
 *   &from=YYYY-MM-DD
 *   &to=YYYY-MM-DD
 *   &limit=50
 *   &offset=0
 *   &format=csv          // optional export
 */
export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;

        const q = (sp.get("q") || "").trim();
        const method = (sp.get("method") || "").trim().toUpperCase();
        const status = (sp.get("status") || "").trim().toUpperCase();
        const from = (sp.get("from") || "").trim();
        const to = (sp.get("to") || "").trim();
        const format = (sp.get("format") || "").toLowerCase();

        const limit = Math.max(1, Math.min(Number(sp.get("limit") || 50), 200));
        const offset = Math.max(0, Number(sp.get("offset") || 0));

        const pool = await getConnection();
        const reqSql = new sql.Request(pool);

        // base filters
        const wheres: string[] = [];
        if (q) {
            reqSql.input("q", sql.NVarChar(256), `%${q}%`);
            wheres.push(
                `(ri.FullName LIKE @q OR ri.Phone LIKE @q OR p.TxnRef LIKE @q OR CONVERT(nvarchar(50), p.RentalId) LIKE @q)`
            );
        }
        if (method) {
            reqSql.input("method", sql.VarChar(20), method);
            wheres.push("p.PaymentMethod = @method");
        }
        if (status) {
            reqSql.input("status", sql.VarChar(20), status);
            wheres.push("p.TransactionStatus = @status");
        }
        if (from) {
            reqSql.input("from", sql.DateTime2, from);
            wheres.push("p.TransactionDate >= @from");
        }
        if (to) {
            reqSql.input("to", sql.DateTime2, to);
            wheres.push("p.TransactionDate < DATEADD(day, 1, @to)");
        }

        const whereSql = wheres.length ? `WHERE ${wheres.join(" AND ")}` : "";

        const baseSelect = `
      SELECT
        p.PaymentId,
        p.RentalId,
        p.RiderId,
        ri.FullName,
        ri.Phone,
        p.Amount,
        p.PaymentMethod,
        p.TxnRef,
        p.TransactionDate,
        p.TransactionStatus,
        p.CreatedAt,
        p.UpdatedAt
      FROM Payments p
      JOIN Riders ri ON ri.RiderId = p.RiderId
      ${whereSql}
    `;

        // CSV export (no pagination)
        if (format === "csv") {
            const resAll = await reqSql.query(`${baseSelect} ORDER BY p.TransactionDate DESC;`);
            const rows = resAll.recordset || [];
            const header = [
                "PaymentId",
                "RentalId",
                "RiderId",
                "RiderName",
                "Phone",
                "Amount",
                "Method",
                "TxnRef",
                "TransactionDate",
                "Status",
                "CreatedAt",
            ].join(",");
            const body = rows
                .map((r: any) =>
                    [
                        r.PaymentId,
                        r.RentalId,
                        r.RiderId,
                        csv(r.FullName),
                        csv(r.Phone),
                        Number(r.Amount ?? 0).toFixed(2),
                        r.PaymentMethod,
                        csv(r.TxnRef),
                        iso(r.TransactionDate),
                        r.TransactionStatus,
                        iso(r.CreatedAt),
                    ].join(",")
                )
                .join("\n");
            return new NextResponse([header, body].join("\n"), {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="payments.csv"`,
                },
            });
        }

        // paginated JSON
        reqSql.input("limit", sql.Int, limit);
        reqSql.input("offset", sql.Int, offset);

        const sqlText = `
      ${baseSelect}
      ORDER BY p.TransactionDate DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;
        const res = await reqSql.query(sqlText);

        const data = (res.recordset || []).map((r: any) => ({
            paymentId: Number(r.PaymentId),
            rentalId: Number(r.RentalId),
            rider: {
                riderId: Number(r.RiderId),
                fullName: r.FullName,
                phone: r.Phone,
            },
            amount: Number(r.Amount ?? 0),
            paymentMethod: String(r.PaymentMethod || ""),
            txnRef: r.TxnRef || null,
            transactionDate: r.TransactionDate,
            transactionStatus: String(r.TransactionStatus || ""),
            createdAt: r.CreatedAt,
            updatedAt: r.UpdatedAt,
        }));

        return NextResponse.json({ ok: true, data });
    } catch (err: any) {
        console.error("GET /admin/payments error:", err);
        return NextResponse.json({ ok: false, error: "Failed to load payments" }, { status: 400 });
    }
}

// helpers
function csv(v: any) {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function iso(d: any) {
    try {
        return new Date(d).toISOString();
    } catch {
        return "";
    }
}
