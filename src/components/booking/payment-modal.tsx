"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, IndianRupee } from "lucide-react";
import { Confetti } from "./confetti";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    planLabel: string;
    amount: number;
}

export function PaymentModal({
                                 isOpen,
                                 onClose,
                                 onSuccess,
                                 planLabel,
                                 amount,
                             }: PaymentModalProps) {
    const [paymentState, setPaymentState] = useState<"processing" | "success">("processing");

    useEffect(() => {
        if (isOpen) {
            setPaymentState("processing");

            // TODO (real integration):
            //   1) Load Cashfree JS
            //   2) const { paymentSessionId } = draft.cashfree
            //   3) window.Cashfree?.checkout({ paymentSessionId, ... })
            //   4) On success callback -> setPaymentState("success")

            // Simulate 3 seconds processing for now
            const timer = setTimeout(() => setPaymentState("success"), 1800);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSuccess = () => onSuccess();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-[425px] p-0"
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                {paymentState === "success" && <Confetti />}
                <div className="relative p-6">
                    <DialogHeader className="text-left">
                        <div className="flex items-center justify-between mb-4">
                            {/* Keep Razorpay image if your next.config images allow it; otherwise replace with a static /cashfree.svg in /public */}
                            <Image
                                src="https://cdn.cashfree.com/assets/cf-logo.svg"
                                alt="Cashfree Logo"
                                width={120}
                                height={26}
                            />
                            <span className="text-sm font-semibold text-muted-foreground">ZapGo Rental</span>
                        </div>

                        {paymentState === "processing" ? (
                            <>
                                <DialogTitle>Processing Payment</DialogTitle>
                                <DialogDescription>
                                    Please wait while we securely process your payment. Do not close this window.
                                </DialogDescription>
                            </>
                        ) : (
                            <>
                                <DialogTitle>Payment Successful!</DialogTitle>
                                <DialogDescription>
                                    Your payment has been processed. Finalizing your booking...
                                </DialogDescription>
                            </>
                        )}
                    </DialogHeader>

                    <div className="my-8 flex flex-col items-center justify-center text-center">
                        {paymentState === "processing" ? (
                            <>
                                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                <p className="mt-4 text-2xl font-bold flex items-center">
                                    <IndianRupee className="h-6 w-6 mr-1" /> {Number(amount).toLocaleString("en-IN")}
                                </p>
                                <p className="text-muted-foreground">{planLabel}</p>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-16 w-16 text-green-500" />
                                <p className="mt-4 text-2xl font-bold flex items-center">
                                    <IndianRupee className="h-6 w-6 mr-1" /> {Number(amount).toLocaleString("en-IN")} Paid
                                </p>
                            </>
                        )}
                    </div>

                    {paymentState === "success" && (
                        <Button onClick={handleSuccess} className="w-full">
                            Confirm Booking
                        </Button>
                    )}

                    <div className="text-xs text-muted-foreground mt-6 text-center">
                        This is a simulated payment for testing. Integrate Cashfree Checkout using the paymentSessionId for live flows.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
