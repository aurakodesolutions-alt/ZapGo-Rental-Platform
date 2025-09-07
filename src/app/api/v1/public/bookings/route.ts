// app/api/v1/public/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import { differenceInCalendarDays, parseISO } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const payload = await req.json().catch(() => null);
    if (!payload) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const { contact, kyc, planId, vehicleId, dates, payment, password } = payload;

    if (!contact?.phone || !contact?.email || !contact?.fullName) {
        return NextResponse.json({ error: "Missing contact fields" }, { status: 400 });
    }
    if (!password || password.length < 6) {
        return NextResponse.json({ error: "Password required (min 6 chars)" }, { status: 400 });
    }
    if (!planId || !vehicleId || !dates?.from || !dates?.to) {
        return NextResponse.json({ error: "Missing planId, vehicleId, or dates" }, { status: 400 });
    }

    const pool = await getConnection();
    const trx = new sql.Transaction(pool);
    await trx.begin();

    try {
        // 0) LOCK + STOCK CHECK
        {
            const r = await new sql.Request(trx)
                .input("vid", sql.BigInt, vehicleId)
                .query(`
          SELECT Quantity
          FROM Vehicles WITH (ROWLOCK, UPDLOCK)
          WHERE VehicleId=@vid AND Status='Available'  -- keep or tweak to your enum
        `);
            if (!r.recordset.length) throw new Error("Vehicle not found");
            const qty = Number(r.recordset[0].Quantity || 0);
            if (qty <= 0) throw new Error("OUT_OF_STOCK");
        }

        // 1) Rider upsert
        let riderId: number;
        {
            const chk = await new sql.Request(trx)
                .input("phone", sql.VarChar, contact.phone)
                .query(`SELECT RiderId, PasswordHash, IsActive FROM Riders WHERE Phone=@phone`);

            if (chk.recordset.length) {
                riderId = chk.recordset[0].RiderId;
                if (!chk.recordset[0].PasswordHash) {
                    const hash = await bcrypt.hash(password, 10);
                    await new sql.Request(trx)
                        .input("rid", sql.Int, riderId)
                        .input("name", sql.NVarChar, contact.fullName)
                        .input("email", sql.NVarChar, contact.email)
                        .input("hash", sql.NVarChar, hash)
                        .query(`
              UPDATE Riders
              SET FullName=@name, Email=@email, PasswordHash=@hash, IsActive=1
              WHERE RiderId=@rid
            `);
                } else {
                    await new sql.Request(trx)
                        .input("rid", sql.Int, riderId)
                        .input("name", sql.NVarChar, contact.fullName)
                        .input("email", sql.NVarChar, contact.email)
                        .query(`
              UPDATE Riders
              SET FullName=@name, Email=@email
              WHERE RiderId=@rid
            `);
                }
            } else {
                const hash = await bcrypt.hash(password, 10);
                const ins = await new sql.Request(trx)
                    .input("name", sql.NVarChar, contact.fullName)
                    .input("email", sql.NVarChar, contact.email)
                    .input("phone", sql.VarChar, contact.phone)
                    .input("hash", sql.NVarChar, hash)
                    .query(`
            INSERT INTO Riders (FullName, Phone, Email, PasswordHash, CreatedAtUtc, IsActive)
            OUTPUT INSERTED.RiderId
            VALUES (@name, @phone, @email, @hash, SYSUTCDATETIME(), 1)
          `);
                riderId = ins.recordset[0].RiderId;
            }
        }

        // 2) KYC upsert
        if (kyc) {
            await new sql.Request(trx)
                .input("rid", sql.Int, riderId)
                .input("aadhaar", sql.Char, kyc.aadhaar || null)
                .input("pan", sql.Char, kyc.pan || null)
                .input("dl", sql.NVarChar, kyc.dl || null)
                .input("aadhaarUrl", sql.NVarChar, kyc.aadhaarImageUrl || null)
                .input("panUrl", sql.NVarChar, kyc.panCardImageUrl || null)
                .input("dlUrl", sql.NVarChar, kyc.drivingLicenseImageUrl || null)
                .query(`
          MERGE RiderKyc AS tgt
          USING (SELECT @rid AS RiderId) AS src
          ON tgt.RiderId = src.RiderId
          WHEN MATCHED THEN UPDATE SET
            AadhaarNumber=@aadhaar,
            PanNumber=@pan,
            DrivingLicenseNumber=@dl,
            AadhaarImageUrl=@aadhaarUrl,
            PanCardImageUrl=@panUrl,
            DrivingLicenseImageUrl=@dlUrl,
            KycCreatedAtUtc=SYSUTCDATETIME()
          WHEN NOT MATCHED THEN
            INSERT (RiderId, AadhaarNumber, PanNumber, DrivingLicenseNumber, AadhaarImageUrl, PanCardImageUrl, DrivingLicenseImageUrl, KycCreatedAtUtc)
            VALUES (@rid, @aadhaar, @pan, @dl, @aadhaarUrl, @panUrl, @dlUrl, SYSUTCDATETIME());
        `);
        }

        // 3) Pricing lookup
        const vehQ = await new sql.Request(trx)
            .input("vid2", sql.BigInt, vehicleId)
            .query(`SELECT RentPerDay FROM Vehicles WHERE VehicleId=@vid2`);
        const planQ = await new sql.Request(trx)
            .input("pid", sql.Int, planId)
            .query(`SELECT JoiningFee, SecurityDeposit FROM Plans WHERE PlanId=@pid`);
        if (!vehQ.recordset.length || !planQ.recordset.length) {
            throw new Error("Plan/Vehicle not found");
        }

        const rentPerDay = Number(vehQ.recordset[0].RentPerDay || 0);
        const joining = Number(planQ.recordset[0].JoiningFee || 0);
        const deposit = Number(planQ.recordset[0].SecurityDeposit || 0);

        const start = parseISO(dates.from);
        const end = parseISO(dates.to);
        const days = Math.max(1, differenceInCalendarDays(end, start) + 1);
        const usage = days * rentPerDay;

        const fullPayable = joining + deposit + usage;
        const amountPaid = Number(payment?.amountPaid || 0);

        // 4) Decrement stock
        {
            const upd = await new sql.Request(trx)
                .input("vid3", sql.BigInt, vehicleId)
                .query(`
          UPDATE Vehicles SET Quantity = Quantity - 1
          WHERE VehicleId=@vid3 AND Quantity > 0;
          SELECT @@ROWCOUNT AS rc;
        `);
            if ((upd.recordset[0]?.rc ?? 0) === 0) throw new Error("OUT_OF_STOCK");
        }

        // 5) Insert Rental
        const pricingJson = JSON.stringify({
            rentPerDay, days, usage, joining, deposit,
            paymentOption: payment?.option || null,
            customAmount: payment?.customAmount || 0,
        });

        const rentalIns = await new sql.Request(trx)
            .input("rid", sql.Int, riderId)
            .input("vid", sql.BigInt, vehicleId)
            .input("pid", sql.Int, planId)
            .input("start", sql.DateTime2, dates.from)
            .input("exp", sql.DateTime2, dates.to)
            .input("status", sql.VarChar, "ongoing")
            .input("rate", sql.Decimal(10, 2), rentPerDay)
            .input("deposit", sql.Decimal(10, 2), deposit)
            .input("pricing", sql.NVarChar, pricingJson)
            .input("payable", sql.Decimal(12, 2), fullPayable)
            .input("paid", sql.Decimal(12, 2), amountPaid)
            .query(`
                INSERT INTO Rentals
                (RiderId, VehicleId, PlanId, StartDate, ExpectedReturnDate, Status,
                 RatePerDay, Deposit, PricingJson, PayableTotal, PaidTotal, CreatedAt, UpdatedAt)
                    OUTPUT INSERTED.RentalId
                VALUES
                    (@rid, @vid, @pid, @start, @exp, @status, @rate, @deposit, @pricing,
                    @payable, @paid, SYSUTCDATETIME(), SYSUTCDATETIME());
            `);

        const rentalId = rentalIns.recordset[0].RentalId;

        // 6) Payment row
        if (amountPaid > 0) {
            await new sql.Request(trx)
                .input("rentalId", sql.BigInt, rentalId)
                .input("rid2", sql.Int, riderId)
                .input("amt", sql.Decimal(12, 2), amountPaid)
                .input("method", sql.VarChar, (payment?.method || "CASHFREE").toUpperCase())
                .input("txn", sql.NVarChar, payment?.txnRef || null)
                .input("status", sql.VarChar, "SUCCESS")
                .query(`
                    INSERT INTO Payments
                    (RentalId, RiderId, Amount, PaymentMethod, TxnRef, TransactionDate,
                     TransactionStatus, CreatedAt, UpdatedAt)
                    VALUES
                        (@rentalId, @rid2, @amt, @method, @txn, SYSUTCDATETIME(), @status,
                         SYSUTCDATETIME(), SYSUTCDATETIME());
                `);
        }

        await trx.commit();
        const balance = fullPayable - amountPaid;
        return NextResponse.json(
            { rentalId, payableTotal: fullPayable, paid: amountPaid, balance: balance },
            { status: 201 }
        );
    } catch (err: any) {
        await trx.rollback();
        return NextResponse.json({ error: err?.message || "Booking failed" }, { status: 400 });
    }
}
