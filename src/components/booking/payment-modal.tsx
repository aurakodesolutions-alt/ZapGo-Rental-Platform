"use client";

import { useEffect, useRef, useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, IndianRupee } from "lucide-react";

type Mode = "sandbox" | "production";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    planLabel: string;
    amount: number;
    paymentSessionId?: string;
    mode?: Mode;
}

declare global {
    interface Window {
        Cashfree?: any;
    }
}

async function loadCashfree(mode: Mode) {
    const src =
        mode === "production"
            ? "https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js"
            : "https://sdk.cashfree.com/js/v3/cashfree.js";
    if (window.Cashfree) return window.Cashfree;
    await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
        document.head.appendChild(s);
    });
    return window.Cashfree;
}

export function PaymentModal({
                                 isOpen,
                                 onClose,
                                 onSuccess,
                                 planLabel,
                                 amount,
                                 paymentSessionId,
                                 mode = "sandbox",
                             }: PaymentModalProps) {
    const [state, setState] = useState<"idle" | "processing" | "success" | "error">("idle");
    const containerRef = useRef<HTMLDivElement>(null);
    const cleanupRef = useRef<() => void>(() => {});

    useEffect(() => {
        if (!isOpen) {
            setState("idle");
            cleanupRef.current?.();
            return;
        }
        if (!paymentSessionId) {
            setState("error");
            return;
        }

        let destroyed = false;
        setState("processing");

        (async () => {
            try {
                const Cashfree = await loadCashfree(mode);

                // Prefer Drop-in if available
                if (Cashfree?.initialiseDropin) {
                    const drp = Cashfree.initialiseDropin(containerRef.current!, {
                        orderToken: paymentSessionId,
                        onSuccess: (_data: any) => {
                            if (!destroyed) setState("success");
                        },
                        onFailure: (err: any) => {
                            console.error("Cashfree failure", err);
                            if (!destroyed) setState("error");
                        },
                        components: ["order-details", "card", "netbanking", "upi", "paylater", "wallet"],
                        checkout: {
                            theme: { color: "#16a34a" },
                        },
                    });
                    cleanupRef.current = () => drp?.destroy?.();
                } else {
                    // Fallback to classic checkout()
                    const cf = new Cashfree({ mode });
                    cf.checkout({
                        paymentSessionId,
                        redirectTarget: "_self",
                        onSuccess: () => !destroyed && setState("success"),
                        onFailure: () => !destroyed && setState("error"),
                    });
                    // classic checkout handles its own UI; nothing to mount
                    cleanupRef.current = () => {};
                }
            } catch (e) {
                console.error(e);
                if (!destroyed) setState("error");
            }
        })();

        return () => {
            destroyed = true;
            cleanupRef.current?.();
        };
    }, [isOpen, paymentSessionId, mode]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader className="text-left">
                    <DialogTitle>Pay with Cashfree</DialogTitle>
                    <DialogDescription>{planLabel}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center text-center gap-3">
                    <p className="text-2xl font-bold flex items-center">
                        <IndianRupee className="h-6 w-6 mr-1" />
                        {Number(amount).toLocaleString("en-IN")}
                    </p>

                    {state === "processing" && (
                        <div className="flex items-center text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Opening Cashfree checkout…
                        </div>
                    )}
                    {state === "success" && (
                        <div className="flex items-center text-green-600">
                            <CheckCircle className="h-6 w-6 mr-2" />
                            Payment Successful
                        </div>
                    )}
                    {state === "error" && (
                        <div className="text-destructive">Payment failed to start. Please try again.</div>
                    )}
                </div>

                {/* Drop-in container (mounted only when using initialiseDropin) */}
                <div ref={containerRef} />

                {state === "success" && (
                    <Button className="w-full" onClick={onSuccess}>
                        Confirm Booking
                    </Button>
                )}
            </DialogContent>
        </Dialog>
    );
}
