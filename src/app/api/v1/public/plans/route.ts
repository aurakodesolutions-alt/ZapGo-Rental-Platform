import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";

export async function GET() {
    const pool = await getConnection();
    const r = await pool.query(`
    SELECT PlanId, PlanName, RequiredDocuments, JoiningFee, SecurityDeposit
    FROM Plans ORDER BY PlanName
  `);
    const items = r.recordset.map(p => ({
        id: p.PlanId,
        name: p.PlanName,
        requiredDocuments: p.RequiredDocuments,
        joiningFee: Number(p.JoiningFee || 0),
        deposit: Number(p.SecurityDeposit || 0),
    }));
    return NextResponse.json({ items });
}
