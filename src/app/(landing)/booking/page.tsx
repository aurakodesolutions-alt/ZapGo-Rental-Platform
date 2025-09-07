// app/booking/success/page.tsx
"use client";

import {Suspense, useEffect, useState} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type Phase = "idle" | "verifying" | "finalizing" | "success" | "failed";

function BookingSucceessReturn (){
    const search = useSearchParams();
    const router = useRouter();

    const orderId = search.get("cf_id") || "";   // ✅ only this is needed

    const [phase, setPhase] = useState<Phase>("idle");
    const [msg, setMsg] = useState<string>("");

    useEffect(() => {
        const run = async () => {
            if (!orderId) {
                setPhase("failed");
                setMsg("Missing payment order id in the return URL.");
                return;
            }

            try {
                setPhase("verifying");
                setMsg("Verifying your payment…");

                // Verify with server
                const vr = await fetch("/api/v1/admin/payments/cashfree/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId }),
                });
                const vdata = await vr.json();
                if (!vr.ok) throw new Error(vdata?.details || vdata?.error || "Verification failed");

                if (String(vdata?.status || "").toUpperCase() !== "SUCCESS") {
                    setPhase("failed");
                    setMsg(`Payment status: ${vdata?.status || "UNKNOWN"}. If you were charged, please contact support.`);
                    return;
                }

                // pull the pending booking we saved in Step 5
                const raw = typeof window !== "undefined" ? sessionStorage.getItem("zapgo_pending_booking") : null;
                if (!raw) {
                    setPhase("success");
                    setMsg("Payment verified! We couldn’t find a pending booking to finalize automatically.");
                    return;
                }

                let payload: any = null;
                try { payload = JSON.parse(raw); } catch {}

                if (!payload) {
                    setPhase("success");
                    setMsg("Payment verified! We couldn’t read your booking draft.");
                    return;
                }

                // bind CF order id to the payment
                payload.payment = { ...(payload.payment || {}), method: "CASHFREE", txnRef: orderId };

                setPhase("finalizing");
                setMsg("Finalizing your booking…");

                const br = await fetch("/api/v1/public/bookings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const bdata = await br.json();
                if (!br.ok) throw new Error(bdata?.error || "Booking confirmation failed");

                try { sessionStorage.removeItem("zapgo_pending_booking"); } catch {}

                const rentalId = bdata?.rentalId || bdata?.id;
                const publicCode = bdata?.publicCode || bdata?.code;

                setPhase("success");
                setMsg("Payment verified and booking confirmed!");

                if (rentalId) {
                    const url = publicCode
                        ? `/booking/${encodeURIComponent(rentalId)}?code=${encodeURIComponent(publicCode)}`
                        : `/booking/${encodeURIComponent(rentalId)}`;
                    router.replace(url);
                }
            } catch (e: any) {
                setPhase("failed");
                setMsg(e?.message || "Something went wrong while verifying/finalizing. If you were charged, contact support.");
            }
        };

        run();
    }, [orderId, router]);

    return (
        <div className="max-w-xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Payment Result</CardTitle>
                    <CardDescription>Order ID: {orderId || "—"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {(phase === "verifying" || phase === "finalizing") && (
                        <div className="flex items-center text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            {msg || "Working…"}
                        </div>
                    )}

                    {phase === "success" && (
                        <div className="space-y-3">
                            <div className="flex items-center text-green-600">
                                <CheckCircle className="h-6 w-6 mr-2" />
                                {msg || "Success!"}
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
                                <Button variant="outline" onClick={() => router.push("/")}>Back to Home</Button>
                            </div>
                        </div>
                    )}

                    {phase === "failed" && (
                        <div className="space-y-3">
                            <div className="flex items-center text-red-600">
                                <XCircle className="h-6 w-6 mr-2" />
                                {msg || "Payment failed"}
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => router.push("/book")}>Try Again</Button>
                                <Button variant="outline" onClick={() => router.push("/")}>Back to Home</Button>
                            </div>
                        </div>
                    )}

                    {phase === "idle" && (
                        <div className="flex items-center text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Preparing result…
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function BookingSuccessReturnPage() {
    return(
        <Suspense>
            <BookingSucceessReturn />
        </Suspense>
    )
}
