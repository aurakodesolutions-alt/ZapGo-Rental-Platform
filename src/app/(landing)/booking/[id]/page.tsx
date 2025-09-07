"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode.react";
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, User, Bike } from "lucide-react";

type BookingPublic = {
    rentalId: number | string;
    status: string;
    startDate: string;
    endDate: string;
    payableTotal: number;
    paidTotal: number;
    balanceDue: number;
    createdAt?: string;
    vehicle: { id: number | string; model: string; images: string[]; rentPerDay: number };
    plan: { id: number; name: string; joiningFee: number; securityDeposit: number };
    rider: { id: number; name: string; email: string; phone: string };
};

export default function BookingDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [data, setData] = useState<BookingPublic | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        const run = async () => {
            setLoading(true);
            setErr(null);
            try {
                const r = await fetch(`/api/v1/public/bookings/${encodeURIComponent(id)}`, { cache: "no-store" });
                const j = await r.json();
                if (!r.ok) throw new Error(j?.error || "Failed to load booking");
                setData(j);
            } catch (e: any) {
                setErr(e?.message || "Failed to load booking");
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [id]);

    const fmt = (n: number) => Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (err || !data) {
        return (
            <div className="max-w-xl mx-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Booking</CardTitle>
                        <CardDescription>ID: {id}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-destructive">{err || "Not found"}</CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <Card className="w-full max-w-3xl mx-auto rounded-2xl shadow-md">
                <CardHeader className="flex justify-between">
                    <div>
                        <CardTitle className="text-2xl">Booking Confirmed 🎉</CardTitle>
                        <CardDescription>Booking ID: {data.rentalId}</CardDescription>
                    </div>
                    <Badge className="capitalize">{String(data.status || "").toLowerCase()}</Badge>
                </CardHeader>

                <CardContent className="grid md:grid-cols-2 gap-8">
                    {/* LEFT: facts & costs */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <span>{data.rider?.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <span>
                {new Date(data.startDate).toLocaleDateString()} – {new Date(data.endDate).toLocaleDateString()}
              </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Bike className="h-5 w-5 text-muted-foreground" />
                            <span>{data.vehicle?.model}</span>
                        </div>

                        <div className="mt-6 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Plan</span>
                                <span className="font-medium">{data.plan?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Joining Fee</span>
                                <span className="font-medium">₹{fmt(data.plan?.joiningFee)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Security Deposit</span>
                                <span className="font-medium">₹{fmt(data.plan?.securityDeposit)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Paid</span>
                                <span className="font-medium">₹{fmt(data.paidTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Balance</span>
                                <span className="font-medium">₹{fmt(data.balanceDue)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-primary">
                                <span>Total</span>
                                <span>₹{fmt(data.payableTotal)}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button onClick={() => router.push("/rider/profile")}>Go to Dashboard</Button>
                            <Button variant="outline" onClick={() => router.push("/")}>Back to Home</Button>
                        </div>
                    </div>

                    {/* RIGHT: image + QR */}
                    <div className="flex flex-col items-center">
                        {data.vehicle?.images?.[0] && (
                            <Image
                                src={data.vehicle.images[0]}
                                alt={data.vehicle.model}
                                width={520}
                                height={320}
                                className="rounded-lg object-cover w-full aspect-video"
                            />
                        )}
                        <div className="mt-6 flex flex-col items-center">
                            <p className="text-sm text-muted-foreground mb-2">Scan to view your booking</p>
                            <div className="p-2 bg-white rounded-md shadow-sm">
                                <QRCode value={JSON.stringify({ id: data.rentalId })} size={160} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
