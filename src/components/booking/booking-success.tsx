"use client";

import { useBookingWizard } from "./booking-provider";
import Link from "next/link";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { CheckCircle2, Copy, Home, Upload, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";

function formatRange(r?: DateRange) {
    if (!r?.from || !r?.to) return "—";
    return `${format(r.from, "PPP")} – ${format(r.to, "PPP")}`;
}

export function BookingSuccess() {
    const { draft, resetDraft } = useBookingWizard();

    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!" });
    };

    // Amounts are OPTIONAL; show “—” gracefully if not present.
    // If you return these from /bookings (recommended), set them into the draft alongside bookingId/Code.
    const payableTotal =
        typeof (draft as any)?.payableTotal === "number"
            ? (draft as any).payableTotal
            : (draft as any)?.pricingPreview?.total;

    const paidTotal =
        typeof (draft as any)?.paid === "number"
            ? (draft as any).paid
            : typeof (draft as any)?.paidTotal === "number"
                ? (draft as any).paidTotal
                : 0;

    const balanceDue =
        typeof (draft as any)?.balance === "number"
            ? (draft as any).balance
            : typeof payableTotal === "number"
                ? Math.max(0, Number(payableTotal) - Number(paidTotal || 0))
                : undefined;

    // Dates: support multi-range (draft.ranges) or single (draft.dates)
    const dateDisplay =
        Array.isArray((draft as any).ranges) && (draft as any).ranges.length > 0
            ? (draft as any).ranges
                .map((r: DateRange) => formatRange(r))
                .filter(Boolean)
                .join(" • ")
            : formatRange(draft.dates);

    const vehicleLabel =
        draft.vehicle?.model || (draft.vehicle as any)?.model || String(draft.vehicle?.vehicleId || "—");

    const planLabel = draft.planName || (draft as any).plan || "—";

    return (
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
            <h2 className="text-3xl font-bold">Booking Confirmed!</h2>

            <p className="text-muted-foreground max-w-md">
                Your scooter has been reserved. Please visit the <b>ZapGo Rental store</b> to complete
                payment and collect your vehicle. Bring your documents for faster verification.
            </p>

            <Card className="w-full max-w-md text-left">
                <CardHeader>
                    <CardTitle>Booking Summary</CardTitle>
                    <CardDescription>ID: {draft.bookingId || "—"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Booking Code</span>
                        <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-primary">
                {draft.bookingCode || "—"}
              </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleCopy(draft.bookingCode || "")}
                                disabled={!draft.bookingCode}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Vehicle</span>
                        <span className="font-medium">{vehicleLabel}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Dates</span>
                        <span className="font-medium">{dateDisplay}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Plan</span>
                        <span className="font-medium capitalize">{planLabel}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount Due at Store</span>
                        <span className="font-medium">
              {typeof balanceDue === "number" ? `₹${balanceDue.toFixed(2)}` : "—"}
            </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Paid Online</span>
                        <span className="font-medium">₹{Number(paidTotal || 0).toFixed(2)}</span>
                    </div>
                </CardContent>
            </Card>

            <div className="w-full max-w-md space-y-2">
                <Button size="lg" className="w-full" asChild>
                    {/* Point this to your KYC/doc upload page if you have one */}
                    <Link href="/rider/kyc">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Documents Now
                    </Link>
                </Button>

                {/* No receipt yet (payment is in-store) */}
                <Button variant="outline" className="w-full" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Download Receipt (PDF)
                </Button>

                <Button asChild variant="ghost" className="w-full" onClick={resetDraft}>
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Go to Home
                    </Link>
                </Button>
            </div>
        </div>
    );
}
