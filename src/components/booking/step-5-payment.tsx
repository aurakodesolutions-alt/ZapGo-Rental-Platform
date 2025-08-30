"use client"

import { useState } from 'react';
import { useBookingWizard } from "./booking-provider";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { BadgeIndianRupee, Loader2 } from "lucide-react";
import { Separator } from "../ui/separator";
import { PaymentModal } from "./payment-modal";
import { toast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';

interface Step5PaymentProps {
    onNext: () => void;
}

export function Step5_Payment({ onNext }: Step5PaymentProps) {
    const { draft, setDraft } = useBookingWizard();
    const { data: session } = useSession();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fees = { joiningFee: 1000, deposit: 1750, total: 2750 };

    const handlePay = async () => {
        if (!session) return;

        setIsProcessing(true);
        try {
            // In a real app, create order and get orderId
            setIsModalOpen(true);
        } catch (error) {
            console.error(error);
            toast({ title: "Payment Error", description: "Could not initiate payment. Please try again.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const onPaymentSuccess = async () => {
        setIsModalOpen(false);
        setIsProcessing(true);
        try {
            const bookingPayload = {
                ...draft,
                schedule: {
                    date: format(draft.dates!.from!, 'yyyy-MM-dd'),
                    slot: '10:00' // Placeholder
                },
                fees: fees,
            };
            const confirmRes = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload)
            });
            if (!confirmRes.ok) throw new Error("Failed to confirm booking.");

            const bookingData = await confirmRes.json();
            setDraft({
                bookingId: bookingData.id,
                bookingCode: bookingData.bookingCode,
            });
            toast({ title: "Booking Confirmed!", description: `Your booking ID is ${bookingData.id}`});
            onNext();

        } catch (error) {
            console.error(error);
            toast({ title: "Booking Error", description: "Could not confirm your booking. Please contact support.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold">Confirm & Pay</h1>
                    <p className="text-muted-foreground">Review your booking and complete the payment.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Booking Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Vehicle</span>
                            <span className="font-medium">{draft.vehicle?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Dates</span>
                            <span className="font-medium">{draft.dates?.from && format(draft.dates.from, "PPP")} - {draft.dates?.to && format(draft.dates.to, "PPP")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Plan</span>
                            <span className="font-medium">{draft.plan}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Joining Fee</span>
                            <span className="font-medium">₹{fees.joiningFee.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Security Deposit</span>
                            <span className="font-medium">₹{fees.deposit.toLocaleString('en-IN')}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold text-primary">
                            <span>Total</span>
                            <span>₹{fees.total.toLocaleString('en-IN')}</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handlePay} disabled={isProcessing} className="w-full">
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeIndianRupee className="mr-2 h-5 w-5"/>}
                            Pay with Razorpay
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            <PaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={onPaymentSuccess}
                plan={draft.plan || 'Lite'}
            />
        </>
    );
}
