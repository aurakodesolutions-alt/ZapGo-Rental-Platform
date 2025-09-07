import { NextRequest, NextResponse } from "next/server";
import { getRiderIdFromRequest } from "@/lib/auth/auth-rider";
import { getConnection, sql } from "@/lib/db";
import { differenceInCalendarDays, parseISO } from "date-fns";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const rid = await getRiderIdFromRequest(req);
    if (!rid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rentalId = Number((await (props.params)).id);
    const { newEndDate } = await req.json().catch(() => ({}));
    if (!rentalId || !newEndDate) return NextResponse.json({ error: "newEndDate required" }, { status: 400 });

    const pool = await getConnection();
    const trx = new sql.Transaction(pool);
    await trx.begin();
    try {
        const t = new sql.Request(trx);
        const cur = await t.input("id", sql.BigInt, rentalId).input("rid", sql.Int, rid).query(`
      SELECT r.StartDate, r.ExpectedReturnDate, r.RatePerDay, r.PayableTotal, r.PaidTotal, r.PricingJson, p.JoiningFee, p.SecurityDeposit
      FROM Rentals r JOIN Plans p ON p.PlanId=r.PlanId
      WHERE r.RentalId=@id AND r.RiderId=@rid
    `);
        if (!cur.recordset.length) throw new Error("Not found");
        const row = cur.recordset[0];

        const start = new Date(row.StartDate);
        const end = parseISO(newEndDate);
        const days = Math.max(1, differenceInCalendarDays(end, start) + 1);
        const usage = days * Number(row.RatePerDay || 0);
        const payable = Number(row.JoiningFee||0) + Number(row.SecurityDeposit||0) + usage;

        const pricing = {
            ...(row.PricingJson ? (()=>{try{return JSON.parse(row.PricingJson)}catch{return{}}})() : {}),
            days, usage, extendedTo: newEndDate,
        };

        await t
            .input("id", sql.BigInt, rentalId)
            .input("rid", sql.Int, rid)
            .input("exp", sql.DateTime2, newEndDate)
            .input("pricing", sql.NVarChar, JSON.stringify(pricing))
            .input("payable", sql.Decimal(12,2), payable)
            // ❗ do NOT write BalanceDue (computed). Let SQL compute or calculate client-side.
            .query(`
        UPDATE Rentals
        SET ExpectedReturnDate=@exp,
            PricingJson=@pricing,
            PayableTotal=@payable,
            UpdatedAt=SYSUTCDATETIME()
        WHERE RentalId=@id AND RiderId=@rid
      `);

        await trx.commit();
        return NextResponse.json({ ok: true, payableTotal: payable });
    } catch (e:any) {
        await trx.rollback();
        return NextResponse.json({ error: e?.message || "Extend failed" }, { status: 400 });
    }
}
