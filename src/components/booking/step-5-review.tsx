"use client";

import { useMemo, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { useBookingWizard } from "./booking-provider";
import { Card, CardHeader, CardContent, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2 } from "lucide-react";

function inclusiveDays(from?: Date, to?: Date) {
    if (!from || !to) return 0;
    return differenceInDays(to, from) + 1;
}

// same normalization logic for safety
function getVehicleId(v: any): number | undefined {
    const raw = v?.vehicleId ?? v?.id ?? v?.VehicleId;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function Step5_Review({ onNext }: { onNext: () => void }) {
    const { draft, setDraft } = useBookingWizard();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const summary = useMemo(() => {
        const joiningFee = Number(draft.joiningFee ?? 0);
        const securityDeposit = Number(draft.deposit ?? 0);
        const rentPerDay = Number(
            (draft.vehicle as any)?.rentPerDay ??
            (draft.vehicle as any)?.RentPerDay ??
            0
        );
        const days = inclusiveDays(draft.dates?.from, draft.dates?.to);
        const usage = rentPerDay * days;
        return {
            joiningFee,
            securityDeposit,
            rentPerDay,
            days,
            usage,
            grandTotal: joiningFee + securityDeposit + usage,
        };
    }, [draft]);

    const vehicleId = getVehicleId(draft.vehicle);
    const canConfirm =
        !!draft.city &&
        !!vehicleId &&
        !!draft.planId &&
        !!(draft.dates?.from && draft.dates?.to) &&
        !!draft.contact?.fullName &&
        !!draft.kyc?.aadhaar &&
        !!draft.accountPassword &&
        !!draft.termsAccepted;

    const confirmBooking = async () => {
        setSubmitting(true);
        setError(null);
        try {
            if (!vehicleId) throw new Error("No vehicle selected");

            const payload = {
                contact: draft.contact,
                kyc: draft.kyc,
                planId: draft.planId,
                vehicleId, // ✅ always defined now
                dates: {
                    from: draft.dates?.from?.toISOString(),
                    to: draft.dates?.to?.toISOString(),
                },
                password: draft.accountPassword,
                payment: {
                    option: "PENDING",
                    amountPaid: 0,
                    method: null,
                    txnRef: null,
                    customAmount: 0,
                },
                pricingPreview: {
                    joiningFee: summary.joiningFee,
                    securityDeposit: summary.securityDeposit,
                    rentPerDay: summary.rentPerDay,
                    days: summary.days,
                    usage: summary.usage,
                    total: summary.grandTotal,
                    lines: [
                        { type: "JOINING_FEE",      label: "Joining Fee",      amount: summary.joiningFee },
                        { type: "SECURITY_DEPOSIT", label: "Security Deposit", amount: summary.securityDeposit },
                        { type: "USAGE_RENT",       label: "Usage Rent",       amount: summary.usage },
                    ],
                },
            };

            const res = await fetch("/api/v1/public/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to confirm booking");

            setDraft({
                bookingId: String(data.rentalId),
                bookingCode: `R-${data.rentalId}`,
            });
            onNext(); // <BookingSuccess />
        } catch (e: any) {
            setError(e?.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Review your booking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="font-medium">City</div>
                            <div className="text-sm text-muted-foreground">{draft.city || "—"}</div>
                        </div>
                        <div>
                            <div className="font-medium">Vehicle</div>
                            <div className="text-sm text-muted-foreground">
                                {(draft.vehicle as any)?.model || (draft.vehicle as any)?.Model || vehicleId || "—"}
                            </div>
                        </div>
                        <div>
                            <div className="font-medium">Plan</div>
                            <div className="text-sm text-muted-foreground">{draft.planName || `#${draft.planId}`}</div>
                        </div>
                        <div>
                            <div className="font-medium">Dates</div>
                            <div className="text-sm text-muted-foreground">
                                {draft.dates?.from && draft.dates?.to
                                    ? `${format(draft.dates.from, "MMM d, yyyy")} → ${format(draft.dates.to, "MMM d, yyyy")} (${summary.days} days)`
                                    : "—"}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <div className="font-medium">Rider</div>
                            <div className="text-sm text-muted-foreground">
                                {draft.contact?.fullName || "—"} {draft.contact?.phone ? `· ${draft.contact.phone}` : ""}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <div className="font-medium">Estimated fees (collected at store)</div>
                        <div className="rounded-md border p-3 text-sm">
                            <div className="flex justify-between py-1">
                                <span>Joining Fee</span>
                                <span>₹{summary.joiningFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span>Security Deposit</span>
                                <span>₹{summary.securityDeposit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span>Usage Rent {summary.rentPerDay ? `(₹${summary.rentPerDay.toFixed(2)}/day)` : ""}</span>
                                <span>₹{summary.usage.toFixed(2)}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between font-semibold">
                                <span>Total</span>
                                <span>₹{summary.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            No payment online. Your vehicle is reserved once you confirm; please complete payment at the ZapGo store.
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={confirmBooking} disabled={submitting || !canConfirm}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {submitting ? "Confirming..." : "Confirm Booking"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Alert>
                <AlertDescription>
                    After confirmation your rental will show as <b>Confirmed</b> in the admin panel. Visit the ZapGo store to verify
                    documents, complete payment, and pick up your vehicle.
                </AlertDescription>
            </Alert>
        </div>
    );
}
