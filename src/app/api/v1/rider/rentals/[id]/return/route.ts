import { NextRequest, NextResponse } from "next/server";
import { getRiderIdFromRequest } from "@/lib/auth/auth-rider";
import { getConnection, sql } from "@/lib/db";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const rid = await getRiderIdFromRequest(req);
    if (!rid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rentalId =Number((await (props.params)).id);
    if (!rentalId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const pool = await getConnection();
    const trx = new sql.Transaction(pool);
    await trx.begin();

    try {
        const t = new sql.Request(trx);
        // Mark as RETURN_REQUESTED; ops can mark as RETURNED and increment stock.
        await t.input("id", sql.BigInt, rentalId).input("rid", sql.Int, rid).query(`
      UPDATE Rentals
      SET Status='RETURN_REQUESTED', UpdatedAt=SYSUTCDATETIME()
      WHERE RentalId=@id AND RiderId=@rid AND Status IN ('CONFIRMED','ONGOING')
    `);

        await trx.commit();
        return NextResponse.json({ ok: true, status: "RETURN_REQUESTED" });
    } catch (e:any) {
        await trx.rollback();
        return NextResponse.json({ error: e?.message || "Return failed" }, { status: 400 });
    }
}
