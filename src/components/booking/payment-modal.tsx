"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, IndianRupee } from 'lucide-react';
import { Confetti } from './confetti';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    plan: 'Lite' | 'Pro';
}

export function PaymentModal({ isOpen, onClose, onSuccess, plan }: PaymentModalProps) {
    const [paymentState, setPaymentState] = useState<'processing' | 'success'>('processing');

    const totalAmount = 1000 + 1750;

    useEffect(() => {
        if (isOpen) {
            setPaymentState('processing');
            const timer = setTimeout(() => {
                setPaymentState('success');
            }, 3000); // Simulate 3 seconds payment processing
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSuccess = () => {
        onSuccess();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] p-0" onPointerDownOutside={(e) => e.preventDefault()}>
                {paymentState === 'success' && <Confetti />}
                <div className="relative p-6">
                    <DialogHeader className="text-left">
                        <div className="flex items-center justify-between mb-4">
                            <Image src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay Logo" width={120} height={26} />
                            <span className="text-sm font-semibold text-muted-foreground">ZapGo Rental</span>
                        </div>
                        {paymentState === 'processing' ? (
                            <>
                                <DialogTitle>Processing Payment</DialogTitle>
                                <DialogDescription>Please wait while we securely process your payment. Do not close this window.</DialogDescription>
                            </>
                        ) : (
                            <>
                                <DialogTitle>Payment Successful!</DialogTitle>
                                <DialogDescription>Your payment has been processed. Finalizing your booking...</DialogDescription>
                            </>
                        )}
                    </DialogHeader>

                    <div className="my-8 flex flex-col items-center justify-center text-center">
                        {paymentState === 'processing' ? (
                            <>
                                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                <p className="mt-4 text-2xl font-bold flex items-center">
                                    <IndianRupee className="h-6 w-6 mr-1" /> {totalAmount.toLocaleString('en-IN')}
                                </p>
                                <p className="text-muted-foreground">for ZapGo {plan} Plan</p>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-16 w-16 text-green-500" />
                                <p className="mt-4 text-2xl font-bold flex items-center">
                                    <IndianRupee className="h-6 w-6 mr-1" /> {totalAmount.toLocaleString('en-IN')} Paid
                                </p>
                            </>
                        )}
                    </div>

                    {paymentState === 'success' && (
                        <Button onClick={handleSuccess} className="w-full">
                            Confirm Booking
                        </Button>
                    )}

                    <div className="text-xs text-muted-foreground mt-6 text-center">
                        This is a simulated payment for demonstration purposes.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
