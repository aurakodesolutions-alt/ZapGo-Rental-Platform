import { NextRequest, NextResponse } from "next/server";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { getConnection, sql } from "@/lib/db";

type PaymentOption = "FULL" | "JOINING_DEPOSIT" | "JOINING_DEPOSIT_CUSTOM";

export async function POST(req: NextRequest) {
    const { planId, vehicleId, startDate, endDate, paymentOption, customAmount } = await req.json();
    if (!planId || !vehicleId || !startDate || !endDate) {
        return NextResponse.json({ error: "Missing inputs" }, { status: 400 });
    }

    const days = Math.max(1, differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1);
    const pool = await getConnection();

    const veh = await pool.request()
        .input("vid", sql.BigInt, vehicleId)
        .query("SELECT RentPerDay FROM Vehicles WHERE VehicleId=@vid");
    const plan = await pool.request()
        .input("pid", sql.Int, planId)
        .query("SELECT JoiningFee, SecurityDeposit FROM Plans WHERE PlanId=@pid");

    const rentPerDay = Number(veh.recordset[0]?.RentPerDay || 0);
    const joining = Number(plan.recordset[0]?.JoiningFee || 0);
    const deposit = Number(plan.recordset[0]?.SecurityDeposit || 0);

    const usage = days * rentPerDay;

    let payable = 0;
    const breakdown: { label: string; amount: number }[] = [];
    switch (paymentOption as PaymentOption) {
        case "FULL":
            payable = joining + deposit + usage;
            breakdown.push(
                { label: "Joining Fee", amount: joining },
                { label: "Security Deposit", amount: deposit },
                { label: `Usage (${days} days @ ₹${rentPerDay}/day)`, amount: usage },
            );
            break;
        case "JOINING_DEPOSIT":
            payable = joining + deposit;
            breakdown.push(
                { label: "Joining Fee", amount: joining },
                { label: "Security Deposit", amount: deposit },
            );
            break;
        case "JOINING_DEPOSIT_CUSTOM":
            payable = joining + deposit + Number(customAmount || 0);
            breakdown.push(
                { label: "Joining Fee", amount: joining },
                { label: "Security Deposit", amount: deposit },
                { label: "Custom Amount", amount: Number(customAmount || 0) },
            );
            break;
    }

    return NextResponse.json({ payable, breakdown, days, rentPerDay, joining, deposit, usage });
}
