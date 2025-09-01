import { z } from 'zod';

export const PlanSchema = z.object({
    planName: z.string().min(2, 'Plan name must be at least 2 characters'),
    // We'll accept either JSON text or comma-separated values in `featuresText`
    featuresText: z.string().optional().default(''),
    requiredDocuments: z.array(z.string()).min(0),
});
export const VehicleFormSchema = z.object({
    planId: z.coerce.number().int().min(1, 'Select a plan'),
    uniqueCode: z.string().min(1, 'Unique code is required'),
    model: z.string().min(1, 'Model is required'),
    vinNumber: z.string().min(4, 'VIN / Serial is required'),
    status: z.enum(['Available', 'Rented']),
    rentPerDay: z.coerce.number().min(0, 'Must be ≥ 0'),

    // NEW
    quantity: z.coerce.number().int().min(1, 'Min 1'),

    lastServiceDate: z.string().optional().nullable(),          // yyyy-mm-dd
    serviceIntervalDays: z.coerce.number().int().min(0).optional().nullable(),

    // replaced CSV with files
    // we’ll still submit derived URLs (public paths)
    tagsCsv: z.string().optional(),
    rating: z.coerce.number().min(0).max(5).optional(),

    specs_rangeKm: z.coerce.number().int().min(0).optional(),
    specs_topSpeedKmph: z.coerce.number().int().min(0).optional(),
    specs_battery: z.string().optional(),
    specs_chargingTimeHrs: z.coerce.number().min(0).optional(),
});
export const VehicleUpdateSchema = z.object({
    planId: z.coerce.number().int().min(1).optional(),
    uniqueCode: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    vinNumber: z.string().min(1).optional(),
    status: z.enum(["Available", "Rented"]).optional(),
    rentPerDay: z.coerce.number().min(0).optional(),
    quantity: z.coerce.number().int().min(1).optional(),

    lastServiceDate: z.string().nullable().optional(),
    serviceIntervalDays: z.coerce.number().int().min(0).nullable().optional(),

    vehicleImagesUrls: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    rating: z.coerce.number().min(0).max(5).optional(),

    specs: z
        .object({
            rangeKm: z.coerce.number().int().optional(),
            topSpeedKmph: z.coerce.number().int().optional(),
            battery: z.string().optional(),
            chargingTimeHrs: z.coerce.number().optional(),
        })
        .optional(),
});


export const RentalSchema = z.object({
    riderId: z.string().min(1, "Rider is required"),
    vehicleId: z.string().min(1, "Vehicle is required"),
    plan: z.enum(['daily', 'weekly']),
    startDate: z.date(),
    expectedReturnDate: z.date(),
    payableTotal: z.coerce.number().min(0),
});

export const ReturnInspectionSchema = z.object({
    odometerEnd: z.coerce.number().min(0).optional(),
    chargePercent: z.coerce.number().min(0).max(100).optional(),
    damageNotes: z.string().optional(),
    accessoriesReturned: z.object({
        helmet: z.boolean().default(false),
        charger: z.boolean().default(false),
        phoneHolder: z.boolean().default(false),
        others: z.string().optional(),
    }).optional(),
    isBatteryMissing: z.boolean().default(false),
    missingItemsCharge: z.coerce.number().min(0).default(0),
    cleaningFee: z.coerce.number().min(0).default(0),
    damageFee: z.coerce.number().min(0).default(0),
    otherAdjustments: z.coerce.number().default(0),
    taxPercent: z.coerce.number().min(0).max(100).default(18),
    remarks: z.string().optional(),
});

export const PaymentSchema = z.object({
    rentalId: z.string().min(1, "Rental selection is required"),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    method: z.enum(['cash', 'upi', 'card', 'bank', 'online']),
    transactionDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    txnRef: z.string().optional(),
});