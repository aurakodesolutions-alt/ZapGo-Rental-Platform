import type {DateRange} from "react-day-picker";
export type ID = string;
export type Currency = 'INR';

export interface Rider {
    riderId: number;

    // Basic info
    fullName: string;
    phone: string;
    email: string;

    passwordHash: string;

    createdAtUtc: string; // ISO date string

    // Nested KYC (optional if not yet submitted)
    kyc?: RiderKyc;
}

export interface RiderKyc {
    riderId: number;

    aadhaarNumber: string;
    aadhaarImageUrl: string;

    panNumber: string;
    panCardImageUrl: string;

    drivingLicenseNumber?: string | null;
    drivingLicenseImageUrl?: string | null;
    selfieImageUrl?: string;

    proPlan: boolean;

    kycCreatedAtUtc: string; // ISO date string
}

// --- Rider create/update DTOs ---

export type RiderKycInput = {
    aadhaarNumber: string;
    aadhaarImageUrl: string;

    panNumber: string;
    panCardImageUrl: string;

    drivingLicenseNumber?: string | null;
    drivingLicenseImageUrl?: string | null;
    selfieImageUrl?: string | null;

};

export type RiderCreateInput = {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    /** Optional: include if KYC is being captured at creation */
    kyc?: RiderKycInput;
};

export type RiderUpdateInput = Partial<RiderCreateInput>;


export type RentalStatus = "ongoing" | "completed" | "overdue" | "cancelled";

export interface Rental {
    rentalId: number;

    // Relations
    riderId: number;
    vehicleId: number;
    planId: number;

    // Period
    startDate: string;             // ISO datetime
    expectedReturnDate: string;    // ISO datetime
    actualReturnDate?: string | null;

    // Status
    status: RentalStatus;

    // Pricing
    ratePerDay: number;
    deposit: number;
    pricingJson?: any;             // JSON with detailed breakdown (e.g. taxes, discounts, etc.)
    payableTotal: number;          // Total bill
    paidTotal: number;             // Sum of all payments
    balanceDue: number;            // Derived field

    // Metadata
    createdAt: string;
    updatedAt: string;
}


export interface Plan {
    planId: number;
    planName: string;
    features?: any;              // stored as JSON in DB, so use `any` or define a type
    requiredDocuments?: string[]; // JSON array (e.g. ["Aadhaar", "PAN", "DL"])
    joiningFees:number;
    securityDeposit: number;
    createdAt: string;           // ISO date string
    updatedAt: string;           // ISO date string
}

export type PlanCreateInput = {
    planName: string;
    requiredDocuments?: string[];
    features?: any;
};

export type PlanUpdateInput = Partial<PlanCreateInput>;

export type VehicleStatus = "Available" | "Rented";

export interface Vehicle {
    vehicleId: number;

    // Relations
    planId: number;
    plan?: Plan; // optional if you load with relation

    // Identity
    uniqueCode: string;
    model: string;
    vinNumber: string;

    // Maintenance
    lastServiceDate?: string | null;
    serviceIntervalDays?: number | null;
    isServiceDue: boolean;

    // Rental status
    status: VehicleStatus;
    rentPerDay: number;
    quantity: number;

    // Media
    vehicleImagesUrls?: string[];  // JSON array of URLs

    // Specs
    specs?: {
        rangeKm?: number;
        topSpeedKmph?: number;
        battery?: string;
        chargingTimeHrs?: number;
    };
    specs_RangeKm?: number;
    specs_TopSpeedKmph?: number;
    specs_Battery?: string;
    specs_ChargingTimeHrs?: number;

    // Misc
    rating?: number;
    tags?: string[];

    // Metadata
    createdAt: string;
    updatedAt: string;
}

export type VehicleCreateInput = {
    planId: number;
    uniqueCode: string;
    model: string;
    vinNumber: string;
    status: VehicleStatus;            // "Available" | "Rented"
    rentPerDay: number;
    quantity?: number;


    lastServiceDate?: string | null;  // yyyy-mm-dd
    serviceIntervalDays?: number | null;

    // media
    vehicleImagesUrls?: string[];     // array of URLs
    tags?: string[];
    rating?: number;

    // specs (either top-level or nested – we’ll send nested from the form)
    specs?: {
        rangeKm?: number;
        topSpeedKmph?: number;
        battery?: string;
        chargingTimeHrs?: number;
    };
};

export type VehicleUpdateInput = Partial<VehicleCreateInput>;



export interface Booking {
    id: string;
    publicCode: string;
    startDate: string;
    endDate: string;
    status: 'confirmed' | 'active' | 'completed' | 'cancelled';
    vehicle: Vehicle;
    userName: string;
}

export type RecoveryType = "normal" | "recovered";

export interface ReturnInspectionPhoto {
    id: string | number;
    url: string;
    name: string;
}

export interface AccessoriesReturned {
    helmet: boolean;
    charger: boolean;
    phoneHolder: boolean;
    others?: string;
}

export interface ReturnInspection {
    id: number;                 // ReturnInspectionId

    rentalId: number;
    riderId: number;
    vehicleId: number;

    recoveryType: RecoveryType; // "normal" | "recovered"

    odometerEnd?: number | null;
    chargePercent?: number | null; // 0..100
    damageNotes?: string | null;
    damagePhotos?: ReturnInspectionPhoto[];       // stored as JSON in DB
    accessoriesReturned?: AccessoriesReturned;    // stored as JSON in DB

    isBatteryMissing: boolean;

    missingItemsCharge: number;
    lateDays: number;
    lateFee: number;
    cleaningFee: number;
    damageFee: number;
    otherAdjustments: number;

    taxPercent: number; // 0..100
    subtotal: number;
    taxAmount: number;
    totalDue: number;

    depositHeld?: number | null;
    depositReturn?: number | null;
    finalAmount: number;

    remarks?: string | null;

    settled: boolean;
    settledAt?: string | null;

    nocIssued: boolean;
    nocId?: string | number | null;

    createdAt: string; // ISO datetime
    updatedAt: string; // ISO datetime
}



export interface Settings {
    companyName: string;
    currency: Currency;
    graceDays: number;
    dailyRateDefault: number;
    weeklyRateDefault: number;
    lateFeeEnabled: boolean;
    lateFeePerDay: number;
}
// export type Plan = "Lite" | "Pro";
export interface WizardBookingDraft {
    dates?: DateRange;
    city?: string;
    vehicle?: Vehicle;
    planId?: number;
    planName: string | undefined;
    joiningFee?: number | null;
    deposit?: number | null;
    holdId?: string;
    holdExpiresAt?: number;
    contact?: { fullName: string; phone: string; email: string };
    accountPassword?: string;
    kyc?: { aadhaar: string; aadhaarImageUrl: string; pan: string; panImageUrl: string; dl?: string; dlImageUrl?: string, selfieImageUrl?: string  };
    termsAccepted?: boolean;
    bookingId?: string;
    bookingCode?: string;
    cashfree?:any;
}

export type PayMethod = 'cash' | 'upi' | 'card' | 'bank' | 'online';

export interface Payment {
    id: ID;
    rentalId: ID;
    riderId: ID;
    amount: number;
    method: PayMethod;
    txnRef?: string;
    transactionDate: string;
    createdAt: string;
    updatedAt: string;
    // Denormalized for convenience
    rider?: Rider;
    rental?: Rental;
}

export interface Alert {
    id: ID;
    type: 'Payment Due' | 'Document Expiry' | 'Overdue Rental' | 'Return Completed' | 'Battery Low Health' | 'Battery Low Charge' | 'Battery Rental Overdue' | 'Battery Missing';
    relatedId: string;
    message: string;
    dueDate: string;
    status: 'read' | 'unread';
    createdAt: string;
    updatedAt: string;
}