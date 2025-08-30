import type {DateRange} from "react-day-picker";
export type ID = string;
export type Currency = 'INR';

export interface Rider {
    id: ID;
    fullName: string;
    phone: string;
    email?: string;
    idProofType: 'Aadhaar' | 'DL' | 'Passport';
    idProofNumber: string;
    documentExpiryDate: string; // ISO
    photoUrl?: string;
    status: 'active' | 'blocked';
    rentalsCount: number;
    totalSpent: number;
    createdAt: string;
    updatedAt: string;
    kycDocuments?: Array<{ name: string; url: string; }>;
}

export type RentalStatus = 'ongoing' | 'completed' | 'overdue' | 'cancelled';

export interface Rental {
    id: ID;
    riderId: ID;
    vehicleId: ID;
    plan: Plan;
    startDate: string;
    expectedReturnDate: string;
    actualReturnDate: string | null;
    status: RentalStatus;
    payableTotal: number;
    paidTotal: number;
    balanceDue: number;
    createdAt: string;
    updatedAt: string;
    // Denormalized for convenience
    rider?: Rider;
    vehicle?: Vehicle;
}

export type Vehicle = {
    id: string;
    code:string;
    name: string;                 // e.g., "ZapGo S1"
    brand: string;                // e.g., "Ola", "Ather"
    images: string[];             // gallery (public URLs)
    thumbnail: string;            // card image
    colorways: string[];          // e.g., ["Black","Green"]
    specs: {
        rangeKm: number;            // true/claimed
        topSpeedKmph: number;
        battery: string;            // e.g., "2.5 kWh"
        chargingTimeHrs: number;
    };
    features: string[];           // e.g., ["Helmet included","App lock","USB charger"]
    compatiblePlans: Plan[];      // ["lite"] | ["pro"] | ["lite","pro"]
    baseRatePerDay: number;       // show-only (pricing is not charged here)
    cityCodes: string[];          // where available (e.g., ["KOL","DEL"])
    deliverySupported: boolean;   // doorstep available?
    rating?: number;              // 3.5–5.0 for card stars
    tags?: string[];              // ["long-range","new","popular"]
};

export interface Booking {
    id: string;
    publicCode: string;
    startDate: string;
    endDate: string;
    status: 'confirmed' | 'active' | 'completed' | 'cancelled';
    vehicle: Vehicle;
    userName: string;
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
export type Plan = "Lite" | "Pro";
export interface WizardBookingDraft {
    dates?: DateRange;
    city?: string;
    vehicle?: Vehicle;
    plan?: Plan;
    holdId?: string;
    holdExpiresAt?: number;
    contact?: { fullName: string; phone: string; email: string };
    kyc?: { aadhaar: string; pan: string; dl?: string };
    termsAccepted?: boolean;
    bookingId?: string;
    bookingCode?: string;
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