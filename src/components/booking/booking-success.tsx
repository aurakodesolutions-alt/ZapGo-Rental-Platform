"use client"

import { useBookingWizard } from "./booking-provider";
import Link from 'next/link';
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { CheckCircle2, Copy, Download, Home, Upload, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export function BookingSuccess() {
    const { draft, resetDraft } = useBookingWizard();

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!" });
    }

    return (
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
            <h2 className="text-3xl font-bold">Booking Confirmed!</h2>
            <p className="text-muted-foreground max-w-md">
                Your ZapGo scooter is booked. Your booking code has been sent to your email.
                Please upload your documents now to speed up verification.
            </p>

            <Card className="w-full max-w-md text-left">
                <CardHeader>
                    <CardTitle>Booking Summary</CardTitle>
                    <CardDescription>ID: {draft.bookingId}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Booking Code</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-lg font-bold text-primary">{draft.bookingCode}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(draft.bookingCode || '')}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Vehicle</span>
                        <span className="font-medium">{draft.vehicle?.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Dates</span>
                        <span className="font-medium">
              {draft.dates?.from ? format(draft.dates.from, "PPP") : 'N/A'} - {draft.dates?.to ? format(draft.dates.to, "PPP") : 'N/A'}
            </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Plan</span>
                        <span className="font-medium capitalize">{draft.plan}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Paid</span>
                        <span className="font-medium">₹2,750.00</span>
                    </div>
                </CardContent>
            </Card>

            <div className="w-full max-w-md space-y-2">
                <Button size="lg" className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Documents Now
                </Button>
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
