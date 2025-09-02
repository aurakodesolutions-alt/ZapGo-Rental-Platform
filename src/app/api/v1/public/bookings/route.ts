import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import { differenceInCalendarDays, parseISO } from "date-fns";

export async function POST(req: NextRequest) {
    const payload = await req.json();
    const {
        contact,     // { fullName, phone, email }
        kyc,         // { aadhaar, pan, dl, ... } (images optional)
        planId,
        vehicleId,
        dates,       // { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
        payment,     // { option: 'FULL' | 'JOINING_DEPOSIT' | 'JOINING_DEPOSIT_CUSTOM', amountPaid: number, customAmount?: number, txnRef?: string, method?: string }
        password     // string (create account)
    } = payload;

    if (!contact?.phone || !contact?.email || !password) {
        return NextResponse.json({ error: "Missing contact or password" }, { status: 400 });
    }

    const pool = await getConnection();
    const trx = new sql.Transaction(pool);
    await trx.begin();

    try {
        const t = new sql.Request(trx);

        // 1) Riders: create or reuse
        const check = await t
            .input("phone", sql.VarChar, contact.phone)
            .query("SELECT RiderId, PasswordHash FROM Riders WHERE Phone=@phone");
        let riderId: number;
        if (check.recordset.length) {
            riderId = check.recordset[0].RiderId;
            // (Optional) allow login later; we don’t force matching password here
        } else {
            const hash = await bcrypt.hash(password, 10);
            const ins = await t
                .input("name", sql.NVarChar, contact.fullName)
                .input("email", sql.VarChar, contact.email)
                .input("phone", sql.VarChar, contact.phone)
                .input("hash", sql.NVarChar, hash)
                .query(`
          INSERT INTO Riders(FullName, Phone, Email, PasswordHash, CreatedAtUtc, IsActive)
          OUTPUT INSERTED.RiderId
          VALUES(@name, @phone, @email, @hash, SYSUTCDATETIME(), 1)
        `);
            riderId = ins.recordset[0].RiderId;
        }

        // 2) KYC upsert (minimal fields you showed)
        if (kyc) {
            await t
                .input("rid", sql.Int, riderId)
                .input("aadhaar", sql.Char, kyc.aadhaar || null)
                .input("pan", sql.Char, kyc.pan || null)
                .input("dl", sql.NVarChar, kyc.dl || null)
                .query(`
          MERGE RiderKyc AS tgt
          USING (SELECT @rid AS RiderId) AS src
          ON tgt.RiderId = src.RiderId
          WHEN MATCHED THEN UPDATE SET
            AadhaarNumber = @aadhaar, PanNumber = @pan, DrivingLicenseNumber = @dl, KycCreatedAtUtc = SYSUTCDATETIME()
          WHEN NOT MATCHED THEN INSERT(RiderId, AadhaarNumber, PanNumber, DrivingLicenseNumber, KycCreatedAtUtc)
          VALUES(@rid, @aadhaar, @pan, @dl, SYSUTCDATETIME());
        `);
        }

        // 3) Pricing (authoritative on server)
        const veh = await t.input("vid", sql.BigInt, vehicleId)
            .query("SELECT RentPerDay FROM Vehicles WHERE VehicleId=@vid");
        const plan = await t.input("pid", sql.Int, planId)
            .query("SELECT JoiningFee, SecurityDeposit FROM Plans WHERE PlanId=@pid");
        if (!veh.recordset.length || !plan.recordset.length) throw new Error("Plan/Vehicle not found");

        const rentPerDay = Number(veh.recordset[0].RentPerDay || 0);
        const joining = Number(plan.recordset[0].JoiningFee || 0);
        const deposit = Number(plan.recordset[0].SecurityDeposit || 0);
        const start = parseISO(dates.from);
        const end = parseISO(dates.to);
        const days = Math.max(1, differenceInCalendarDays(end, start) + 1);
        const usage = days * rentPerDay;

        const fullPayable = joining + deposit + usage;
        let amountPaid = Number(payment?.amountPaid || 0);

        // 4) Create Rental
        const pricingJson = JSON.stringify({
            rentPerDay, days, usage, joining, deposit,
            paymentOption: payment?.option, customAmount: payment?.customAmount || 0
        });

        const rentalIns = await t
            .input("rid", sql.Int, riderId)
            .input("vid", sql.BigInt, vehicleId)
            .input("pid", sql.Int, planId)
            .input("start", sql.DateTime2, dates.from)
            .input("exp", sql.DateTime2, dates.to)
            .input("status", sql.VarChar, "CONFIRMED")
            .input("rate", sql.Decimal(10,2), rentPerDay)
            .input("deposit", sql.Decimal(10,2), deposit)
            .input("pricing", sql.NVarChar, pricingJson)
            .input("payable", sql.Decimal(12,2), fullPayable)
            .input("paid", sql.Decimal(12,2), amountPaid)
            .input("balance", sql.Decimal(13,2), fullPayable - amountPaid)
            .query(`
        INSERT INTO Rentals (RiderId, VehicleId, PlanId, StartDate, ExpectedReturnDate, Status, RatePerDay, Deposit, PricingJson, PayableTotal, PaidTotal, BalanceDue, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.RentalId
        VALUES (@rid, @vid, @pid, @start, @exp, @status, @rate, @deposit, @pricing, @payable, @paid, @balance, SYSUTCDATETIME(), SYSUTCDATETIME())
      `);

        const rentalId = rentalIns.recordset[0].RentalId;

        // 5) Payments row (for the up-front amount)
        if (amountPaid > 0) {
            await t
                .input("rentalId", sql.BigInt, rentalId)
                .input("rid", sql.Int, riderId)
                .input("amt", sql.Decimal(12,2), amountPaid)
                .input("method", sql.VarChar, payment?.method || "CASHFREE")
                .input("txn", sql.NVarChar, payment?.txnRef || null)
                .input("status", sql.VarChar, "SUCCESS")
                .query(`
          INSERT INTO Payments (RentalId, RiderId, Amount, PaymentMethod, TxnRef, TransactionDate, TransactionStatus, CreatedAt, UpdatedAt)
          VALUES (@rentalId, @rid, @amt, @method, @txn, SYSUTCDATETIME(), @status, SYSUTCDATETIME(), SYSUTCDATETIME())
        `);
        }

        await trx.commit();
        return NextResponse.json({ rentalId, payableTotal: fullPayable, paid: amountPaid, balance: fullPayable - amountPaid });
    } catch (e: any) {
        await trx.rollback();
        return NextResponse.json({ error: e?.message || "Booking failed" }, { status: 400 });
    }
}
