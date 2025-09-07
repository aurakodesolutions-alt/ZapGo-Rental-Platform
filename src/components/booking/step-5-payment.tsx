"use client";

import { useEffect, useMemo, useState } from "react";
import { useBookingWizard } from "./booking-provider";
import { Button } from "../ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { BadgeIndianRupee, Loader2 } from "lucide-react";
import { Separator } from "../ui/separator";
import { PaymentModal } from "./payment-modal";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type PaymentOption = "FULL" | "JOINING_DEPOSIT" | "JOINING_DEPOSIT_CUSTOM";

export function Step5_Payment({ onNext }: { onNext: () => void }) {
    const { draft, setDraft } = useBookingWizard();
    const [paymentOption, setPaymentOption] = useState<PaymentOption>("JOINING_DEPOSIT");
    const [customAmount, setCustomAmount] = useState<number>(0);
    const [paymentSessionId, setPaymentSessionId] = useState(null);

    const [quote, setQuote] = useState<{
        payable: number;
        breakdown: { label: string; amount: number }[];
        days: number;
        rentPerDay: number;
        joining: number;
        deposit: number;
        usage: number;
    } | null>(null);

    const [loadingQuote, setLoadingQuote] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // convenience
    const planId = draft.planId ?? (draft as any).plan?.id;
    const vehicleId = draft.vehicle?.id;
    const startDate = draft.dates?.from ? format(draft.dates.from as Date, "yyyy-MM-dd") : undefined;
    const endDate = draft.dates?.to ? format(draft.dates.to as Date, "yyyy-MM-dd") : undefined;

    // fetch quote whenever inputs change
    useEffect(() => {
        const run = async () => {
            if (!planId || !vehicleId || !startDate || !endDate) {
                setQuote(null);
                return;
            }
            setLoadingQuote(true);
            try {
                const res = await fetch("/api/v1/public/quote", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        planId,
                        vehicleId,
                        startDate,
                        endDate,
                        paymentOption,
                        customAmount: paymentOption === "JOINING_DEPOSIT_CUSTOM" ? Number(customAmount || 0) : 0,
                    }),
                });
                if (!res.ok) throw new Error("Quote failed");
                const data = await res.json();
                setQuote(data);
            } catch (e: any) {
                setQuote(null);
                toast({
                    title: "Couldn’t compute quote",
                    description: e?.message || "Please check your inputs.",
                    variant: "destructive",
                });
            } finally {
                setLoadingQuote(false);
            }
        };
        run();
    }, [planId, vehicleId, startDate, endDate, paymentOption, customAmount]);

    const amountToPayNow = useMemo(() => Number(quote?.payable || 0), [quote]);

    const handlePay = async () => {
        // basic guards
        if (!planId || !vehicleId || !startDate || !endDate) {
            toast({
                title: "Missing details",
                description: "Please select vehicle, plan, and dates.",
                variant: "destructive",
            });
            return;
        }
        if (!draft.contact?.email || !draft.contact?.phone || !draft.accountPassword) {
            toast({
                title: "Incomplete rider details",
                description: "Please provide contact info and create a password.",
                variant: "destructive",
            });
            return;
        }
        if (!quote) {
            toast({ title: "No quote yet", description: "Please wait for totals.", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        try {
            const PENDING_KEY = "zapgo_pending_booking";

// Build a minimal server-friendly payload (NO File objects)
            const pending = {
                contact: draft.contact,                     // { fullName, phone, email }
                kyc: {
                    aadhaar: draft.kyc?.aadhaar,
                    pan: draft.kyc?.pan,
                    dl: draft.kyc?.dl,
                    // if you uploaded images in Step 4, store the URLs:
                    aadhaarImageUrl: draft.kyc?.aadhaarImageUrl ?? null,
                    panCardImageUrl: draft.kyc?.panImageUrl ?? null,
                    drivingLicenseImageUrl: draft.kyc?.dlImageUrl ?? null,
                },
                planId: draft!.planId,
                vehicleId: draft.vehicle!.id,
                dates: {
                    from: format(draft.dates!.from!, "yyyy-MM-dd"),
                    to:   format(draft.dates!.to!,   "yyyy-MM-dd"),
                },
                password: draft.accountPassword,            // from Step 4 password field
                payment: {
                    option: paymentOption,                   // FULL | JOINING_DEPOSIT | JOINING_DEPOSIT_CUSTOM
                    amountPaid: quote.payable,                 // from /api/public/quote
                    customAmount: customAmount ?? 0,
                },
            };

            sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));

            // Create Cashfree order (server)
            const orderId = `ORD-${Date.now()}-${vehicleId}`;
            const res = await fetch("/api/v1/admin/payments/cashfree/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId,
                    amount: amountToPayNow,
                    customer: {
                        id: draft.contact.phone,
                        name: draft.contact.fullName,
                        email: draft.contact.email,
                        phone: draft.contact.phone,
                    },
                }),
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Cashfree order failed: ${txt}`);
            }

            const { paymentSessionId } = await res.json();

            // Save for later steps (optional)
            setDraft({ cashfree: { orderId, paymentSessionId } });

            // Open the modal. In the real checkout, you would now:
            // 1) Load Cashfree JS
            // 2) call cashfree.checkout({ paymentSessionId })
            // For now, we simulate success so you can test booking flow end-to-end.
            setIsModalOpen(true);
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Payment Error",
                description: error?.message || "Could not initiate payment. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const onPaymentSuccess = async () => {
        // Close the modal and confirm booking
        setIsModalOpen(false);
        setIsProcessing(true);

        try {
            const txnRef = (draft as any).cashfree?.orderId || `SIM-${Date.now()}`;
            const bookingPayload = {
                contact: {
                    fullName: draft.contact?.fullName,
                    phone: draft.contact?.phone,
                    email: draft.contact?.email,
                },
                kyc: draft.kyc,
                planId,
                vehicleId,
                dates: { from: startDate, to: endDate },
                password: draft.accountPassword,
                payment: {
                    option: paymentOption,
                    amountPaid: amountToPayNow,
                    method: "CASHFREE",
                    txnRef,
                    customAmount: paymentOption === "JOINING_DEPOSIT_CUSTOM" ? Number(customAmount || 0) : 0,
                },
            };

            const confirmRes = await fetch("/api/v1/public/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bookingPayload),
            });
            const bookingData = await confirmRes.json();
            if (!confirmRes.ok) throw new Error(bookingData?.error || "Failed to confirm booking.");

            setDraft({
                bookingId: bookingData.rentalId,
                bookingCode: `R-${bookingData.rentalId}`,
            });

            toast({
                title: "Booking Confirmed!",
                description: `Your rental #${bookingData.rentalId} is confirmed.`,
            });
            onNext();
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Booking Error",
                description: error?.message || "Could not confirm your booking. Please contact support.",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold">Confirm & Pay</h1>
                    <p className="text-muted-foreground">Review your booking, pick a payment option, and complete the payment.</p>
                </div>

                {/* Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Booking Summary</CardTitle>
                        <CardDescription>
                            {draft.vehicle?.model || "Scooter"} •{" "}
                            {startDate && endDate ? `${format(draft.dates!.from!, "PPP")} – ${format(draft.dates!.to!, "PPP")}` : "Select dates"} •{" "}
                            {draft.planName || `Plan #${planId}`}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Payment Options */}
                        <div className="space-y-3">
                            <div className="text-sm font-semibold">Choose how you’d like to pay now:</div>
                            <div className="grid md:grid-cols-3 gap-3">
                                <label
                                    className={cn(
                                        "border rounded-md p-3 cursor-pointer",
                                        paymentOption === "FULL" ? "border-primary ring-1 ring-primary" : "hover:bg-muted/30"
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="payopt"
                                        className="mr-2"
                                        checked={paymentOption === "FULL"}
                                        onChange={() => setPaymentOption("FULL")}
                                    />
                                    Full Payment
                                    <div className="text-xs text-muted-foreground">
                                        Days × Rate + Joining + Deposit
                                    </div>
                                </label>

                                <label
                                    className={cn(
                                        "border rounded-md p-3 cursor-pointer",
                                        paymentOption === "JOINING_DEPOSIT" ? "border-primary ring-1 ring-primary" : "hover:bg-muted/30"
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="payopt"
                                        className="mr-2"
                                        checked={paymentOption === "JOINING_DEPOSIT"}
                                        onChange={() => setPaymentOption("JOINING_DEPOSIT")}
                                    />
                                    Joining + Deposit
                                    <div className="text-xs text-muted-foreground">
                                        Pay usage later (weekly or daily)
                                    </div>
                                </label>

                                <div
                                    className={cn(
                                        "border rounded-md p-3",
                                        paymentOption === "JOINING_DEPOSIT_CUSTOM" ? "border-primary ring-1 ring-primary" : "hover:bg-muted/30"
                                    )}
                                >
                                    <label className="cursor-pointer">
                                        <input
                                            type="radio"
                                            name="payopt"
                                            className="mr-2"
                                            checked={paymentOption === "JOINING_DEPOSIT_CUSTOM"}
                                            onChange={() => setPaymentOption("JOINING_DEPOSIT_CUSTOM")}
                                        />
                                        Joining + Deposit + Custom
                                    </label>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Custom:</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={customAmount}
                                            onChange={(e) => setCustomAmount(Number(e.target.value || 0))}
                                            className="w-28 rounded-md border px-2 py-1 text-sm"
                                            disabled={paymentOption !== "JOINING_DEPOSIT_CUSTOM"}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div>
                            <h3 className="font-semibold mb-2">Payment Breakdown</h3>
                            {loadingQuote ? (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Calculating…
                                </div>
                            ) : quote ? (
                                <div className="space-y-2 text-sm">
                                    {quote.breakdown.map((b, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span className="text-muted-foreground">{b.label}</span>
                                            <span className="font-medium">₹{Number(b.amount).toLocaleString("en-IN")}</span>
                                        </div>
                                    ))}
                                    <Separator />
                                    <div className="flex justify-between text-lg font-bold text-primary">
                                        <span>Total Now</span>
                                        <span>₹{amountToPayNow.toLocaleString("en-IN")}</span>
                                    </div>
                                    {paymentOption !== "FULL" && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            <strong>Note:</strong> Since you haven’t paid the full amount, you’ll need to pay the rent
                                            <strong> every Monday (for the full week)</strong> or <strong>pay daily</strong> from your dashboard.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">No quote available yet.</div>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter>
                        <Button onClick={handlePay} disabled={isProcessing || !quote} className="w-full">
                            {isProcessing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <BadgeIndianRupee className="mr-2 h-5 w-5" />
                            )}
                            Pay with Cashfree
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <PaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={onPaymentSuccess}
                planLabel={draft.planName || `Plan #${planId}`}
                paymentSessionId={draft?.cashfree?.paymentSessionId}
                amount={amountToPayNow}
            />
        </>
    );
}
