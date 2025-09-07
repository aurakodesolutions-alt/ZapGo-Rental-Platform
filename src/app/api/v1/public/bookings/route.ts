// app/api/v1/public/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import { differenceInCalendarDays, parseISO } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    let trx: sql.Transaction | null = null;

    try {
        const payload = await req.json();
        const { contact, kyc, planId, vehicleId, dates, payment, password } = payload ?? {};

        // Basic validation
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

        trx = new sql.Transaction(pool);
        // SERIALIZABLE + locks make stock checks safe under concurrency
        await trx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        const tReq = () => new sql.Request(trx!);

        // 0) LOCK + STOCK CHECK
        {
            const r = await tReq()
                .input("vid", sql.BigInt, vehicleId)
                .query(`
          SELECT Quantity
          FROM Vehicles WITH (UPDLOCK, ROWLOCK, HOLDLOCK)
          WHERE VehicleId=@vid AND Status='Available';
        `);

            if (!r.recordset.length) throw new Error("Vehicle not found");
            const qty = Number(r.recordset[0].Quantity || 0);
            if (qty <= 0) throw new Error("OUT_OF_STOCK");
        }

        // 1) Rider upsert
        let riderId: number;
        {
            const chk = await tReq()
                .input("phone", sql.VarChar(15), contact.phone)
                .query(`SELECT RiderId, PasswordHash, IsActive FROM Riders WHERE Phone=@phone`);

            if (chk.recordset.length) {
                riderId = chk.recordset[0].RiderId;
                if (!chk.recordset[0].PasswordHash) {
                    const hash = await bcrypt.hash(password, 10);
                    await tReq()
                        .input("rid", sql.Int, riderId)
                        .input("name", sql.NVarChar(100), contact.fullName)
                        .input("email", sql.NVarChar(256), contact.email)
                        .input("hash", sql.NVarChar(255), hash)
                        .query(`
              UPDATE Riders
              SET FullName=@name, Email=@email, PasswordHash=@hash, IsActive=1
              WHERE RiderId=@rid;
            `);
                } else {
                    await tReq()
                        .input("rid", sql.Int, riderId)
                        .input("name", sql.NVarChar(100), contact.fullName)
                        .input("email", sql.NVarChar(256), contact.email)
                        .query(`
              UPDATE Riders
              SET FullName=@name, Email=@email
              WHERE RiderId=@rid;
            `);
                }
            } else {
                const hash = await bcrypt.hash(password, 10);
                const ins = await tReq()
                    .input("name", sql.NVarChar(100), contact.fullName)
                    .input("email", sql.NVarChar(256), contact.email)
                    .input("phone", sql.VarChar(15), contact.phone)
                    .input("hash", sql.NVarChar(255), hash)
                    .query(`
            INSERT INTO Riders (FullName, Phone, Email, PasswordHash, CreatedAtUtc, IsActive)
            OUTPUT INSERTED.RiderId
            VALUES (@name, @phone, @email, @hash, SYSUTCDATETIME(), 1);
          `);
                riderId = ins.recordset[0].RiderId;
            }
        }

        // 2) KYC upsert
        // 2) KYC upsert (accept multiple client key variants + avoid null overwrite)
        if (kyc) {
            const clean = (v: any) =>
                v === undefined || v === null || String(v).trim() === "" ? null : String(v).trim();

            const aadhaarNum = clean(kyc.aadhaar);
            const panNum     = clean(kyc.pan);
            const dlNum      = clean(kyc.dl);

            // accept both naming conventions from clients
            const aadhaarUrl = clean(kyc.aadhaarImageUrl ?? kyc.aadhaarUrl);
            const panUrl     = clean(kyc.panCardImageUrl ?? kyc.panImageUrl);
            const dlUrl      = clean(kyc.drivingLicenseImageUrl ?? kyc.dlImageUrl);
            const selfieUrl  = clean(kyc.selfieImageUrl ?? kyc.selfieUrl ?? kyc.selfieFile);

            await tReq()
                .input("rid",        sql.Int,          riderId)
                .input("aadhaar",    sql.Char(12),     aadhaarNum)
                .input("pan",        sql.Char(10),     panNum)
                .input("dl",         sql.NVarChar(32), dlNum)
                .input("aadhaarUrl", sql.NVarChar(2048), aadhaarUrl)
                .input("panUrl",     sql.NVarChar(2048), panUrl)
                .input("dlUrl",      sql.NVarChar(2048), dlUrl)
                .input("selfieUrl",  sql.NVarChar(2048), selfieUrl)
                .query(`
      MERGE RiderKyc AS tgt
      USING (SELECT @rid AS RiderId) AS src
      ON tgt.RiderId = src.RiderId
      WHEN MATCHED THEN
        UPDATE SET
          AadhaarNumber           = COALESCE(@aadhaar,    tgt.AadhaarNumber),
          PanNumber               = COALESCE(@pan,        tgt.PanNumber),
          DrivingLicenseNumber    = COALESCE(@dl,         tgt.DrivingLicenseNumber),
          AadhaarImageUrl         = COALESCE(@aadhaarUrl, tgt.AadhaarImageUrl),
          PanCardImageUrl         = COALESCE(@panUrl,     tgt.PanCardImageUrl),
          DrivingLicenseImageUrl  = COALESCE(@dlUrl,      tgt.DrivingLicenseImageUrl),
          SelfieImageUrl          = COALESCE(@selfieUrl,  tgt.SelfieImageUrl),
          KycCreatedAtUtc         = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (RiderId, AadhaarNumber, PanNumber, DrivingLicenseNumber,
                AadhaarImageUrl, PanCardImageUrl, DrivingLicenseImageUrl, SelfieImageUrl, KycCreatedAtUtc)
        VALUES (@rid, @aadhaar, @pan, @dl, @aadhaarUrl, @panUrl, @dlUrl, @selfieUrl, SYSUTCDATETIME());
    `);
        }


        // 3) Pricing lookup
        const vehQ = await tReq()
            .input("vid2", sql.BigInt, vehicleId)
            .query(`SELECT RentPerDay FROM Vehicles WHERE VehicleId=@vid2`);
        const planQ = await tReq()
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

        const payableTotal = joining + deposit + usage;
        const amountPaid = Number(payment?.amountPaid || 0);

        // 4) Decrement stock atomically
        {
            const upd = await tReq()
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

        const rentalIns = await tReq()
            .input("rid", sql.Int, riderId)
            .input("vid", sql.BigInt, vehicleId)
            .input("pid", sql.Int, planId)
            .input("start", sql.DateTime2, dates.from)
            .input("exp", sql.DateTime2, dates.to)
            .input("status", sql.VarChar(20), "ongoing")
            .input("rate", sql.Decimal(10,2), rentPerDay)
            .input("deposit", sql.Decimal(10,2), deposit)
            .input("pricing", sql.NVarChar(sql.MAX), pricingJson)
            .input("payable", sql.Decimal(12,2), payableTotal)
            .input("paid", sql.Decimal(12,2), amountPaid)
            .query(`
        INSERT INTO Rentals
          (RiderId, VehicleId, PlanId, StartDate, ExpectedReturnDate, Status,
           RatePerDay, Deposit, PricingJson, PayableTotal, PaidTotal, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.RentalId
        VALUES
          (@rid, @vid, @pid, @start, @exp, @status,
           @rate, @deposit, @pricing, @payable, @paid, SYSUTCDATETIME(), SYSUTCDATETIME());
      `);

        const rentalId = rentalIns.recordset[0].RentalId;

        // 6) Payment (optional)
        if (amountPaid > 0) {
            await tReq()
                .input("rentalId", sql.BigInt, rentalId)
                .input("rid2", sql.Int, riderId)
                .input("amt", sql.Decimal(12,2), amountPaid)
                .input("method", sql.VarChar(20), (payment?.method || "CASHFREE").toUpperCase())
                .input("txn", sql.NVarChar(256), payment?.txnRef || null)
                .input("status", sql.VarChar(20), "SUCCESS")
                .query(`
          INSERT INTO Payments
            (RentalId, RiderId, Amount, PaymentMethod, TxnRef, TransactionDate,
             TransactionStatus, CreatedAt, UpdatedAt)
          VALUES
            (@rentalId, @rid2, @amt, @method, @txn, SYSUTCDATETIME(),
             @status, SYSUTCDATETIME(), SYSUTCDATETIME());
        `);
        }

        await trx.commit();
        trx = null; // avoid double-rollback in finally

        const balance = payableTotal - amountPaid;
        return NextResponse.json(
            { rentalId, payableTotal, paid: amountPaid, balance },
            { status: 201 }
        );
    } catch (err: any) {
        // Only rollback if the transaction is still active
        try {
            if (trx && (trx as any)._aborted !== true) {
                await trx.rollback();
            }
        } catch (rbErr) {
            // swallow; the transaction might already be finalized by the driver
        }
        console.error("booking error:", err);
        const message =
            err?.code === "ETIMEOUT"
                ? "Database timed out, please retry."
                : err?.message || "Booking failed";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
