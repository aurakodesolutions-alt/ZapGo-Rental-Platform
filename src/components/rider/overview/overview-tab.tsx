"use client";

import useSWR from "swr";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    CalendarPlus,
    IndianRupee,
    Wallet,
    CalendarClock,
    BadgeAlert,
} from "lucide-react";

const fetcher = (url: string) =>
    fetch(url).then(async (r) => {
        const txt = await r.text();
        const json = txt ? JSON.parse(txt) : null;
        if (!r.ok) {
            const msg =
                (json && (json.error || json.message)) || `Request failed: ${r.status}`;
            throw new Error(msg);
        }
        return json;
    });

const formatINR = (n?: number) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

type UiSummary = {
    activeRentals: number;
    nextReturnDate?: string | null;
    totalDue: number;
    lastPayment?: { amount: number; createdAt: string } | null;
};

type UiRental = {
    rentalId: number | string;
    vehicle: {
        id: number | string;
        model: string;
        planName?: string;
        rentPerDay: number;
        image?: string;
    };
    startDate: string;
    endDate: string;
    deposit: number;
    paidTotal: number;
    balanceDue: number;
    status:
        | "CONFIRMED"
        | "ONGOING"
        | "RETURN_REQUESTED"
        | "COMPLETED"
        | "CANCELLED";
};

function mapSummary(api: any): UiSummary {
    const s = api?.stats || {};
    const ar = api?.activeRental || null;
    const lp = api?.lastPayment || null;

    return {
        activeRentals: Number(s.activeRentals || 0),
        totalDue: Number(s.balanceDue || 0),
        nextReturnDate: ar?.ExpectedReturnDate || null,
        lastPayment: lp
            ? {
                amount: Number(lp.Amount || 0),
                createdAt: lp.TransactionDate || "",
            }
            : null,
    };
}

function mapRentals(api: any): { items: UiRental[] } {
    const source: any[] =
        Array.isArray(api?.items) ? api.items : Array.isArray(api) ? api : [];

    const items: UiRental[] = source.map((r: any) => {
        const statusRaw = String(r.status || r.Status || "").toUpperCase();
        const status: UiRental["status"] = ([
            "CONFIRMED",
            "ONGOING",
            "RETURN_REQUESTED",
            "COMPLETED",
            "CANCELLED",
        ].includes(statusRaw)
            ? statusRaw
            : "CONFIRMED") as UiRental["status"];

        const vehicle = r.vehicle || {};
        const images = vehicle.images || r.images || [];
        const firstImage =
            (Array.isArray(images) && images[0]) ||
            r.vehicle?.image ||
            "/images/vehicles/placeholder.webp";

        return {
            rentalId: r.rentalId || r.RentalId || r.id,
            vehicle: {
                id: vehicle.id || r.VehicleId,
                model: vehicle.model || r.Model || "Scooter",
                planName: vehicle.planName || r.plan?.name || r.PlanName || undefined,
                // CORRECTED LINE: Access rentPerDay from the vehicle object
                rentPerDay: Number(vehicle.rentPerDay || r.RatePerDay || 0),
                image: firstImage,
            },
            startDate: r.startDate || r.StartDate,
            endDate: r.endDate || r.ExpectedReturnDate || r.EndDate,

            deposit: Number(r.deposit || r.Deposit || 0),
            paidTotal: Number(r.paidTotal || r.PaidTotal || 0),
            balanceDue: Number(r.balanceDue || r.BalanceDue || 0),
            status,
        };
    });

    return { items };
}

export default function OverviewTab() {
    const { data: summaryRaw, isLoading: loadingSummary } = useSWR(
        "/api/v1/rider/summary",
        fetcher
    );
    const {
        data: rentalsRaw,
        isLoading: loadingRentals,
        mutate,
    } = useSWR("/api/v1/rider/rentals?page=1&pageSize=5", fetcher);

    const summary: UiSummary | undefined = useMemo(
        () => (summaryRaw ? mapSummary(summaryRaw) : undefined),
        [summaryRaw]
    );

    const rentals: { items: UiRental[] } | undefined = useMemo(
        () => (rentalsRaw ? mapRentals(rentalsRaw) : undefined),
        [rentalsRaw]
    );

    const current = useMemo(
        () =>
            rentals?.items?.find((r) => ["ONGOING", "CONFIRMED"].includes(r.status)),
        [rentals]
    );

    const [payOpen, setPayOpen] = useState(false);
    const [extendOpen, setExtendOpen] = useState(false);
    const [returnOpen, setReturnOpen] = useState(false);
    const [payAmount, setPayAmount] = useState<number>(
        Math.max(0, current?.balanceDue || 0)
    );
    const [extendDate, setExtendDate] = useState<string>("");
    const [returnNote, setReturnNote] = useState<string>("");

    const onPay = async () => {
        if (!current) return;
        const res = await fetch("/api/v1/rider/payments/intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rentalId: current.rentalId, amount: payAmount }),
        });
        const data = await res.json();
        if (!res.ok) return alert(data?.error || "Failed to create payment intent");
        window.location.href = `/pay/cashfree?orderId=${encodeURIComponent(
            data.orderId
        )}&amount=${data.amount}`;
    };

    const onExtend = async () => {
        if (!current || !extendDate) return;
        const res = await fetch(`/api/v1/rider/rentals/${current.rentalId}/extend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: extendDate }),
        });
        const data = await res.json();
        if (!res.ok) return alert(data?.error || "Failed to extend");
        setExtendOpen(false);
        mutate();
    };

    const onReturn = async () => {
        if (!current) return;
        const res = await fetch(`/api/v1/rider/rentals/${current.rentalId}/return`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ note: returnNote || undefined }),
        });
        const data = await res.json();
        if (!res.ok) return alert(data?.error || "Failed to request return");
        setReturnOpen(false);
        mutate();
    };
    console.log(current)
    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Active Rentals"
                    value={loadingSummary ? "…" : String(summary?.activeRentals ?? 0)}
                    icon={<CalendarClock className="h-5 w-5 text-primary" />}
                />
                <KpiCard
                    title="Total Due"
                    value={`₹${loadingSummary ? "…" : formatINR(summary?.totalDue)}`}
                    icon={<IndianRupee className="h-5 w-5 text-primary" />}
                    right={
                        summary && summary.totalDue > 0 ? (
                            <Badge variant="destructive">Due</Badge>
                        ) : null
                    }
                />
                <KpiCard
                    title="Next Return"
                    value={
                        loadingSummary
                            ? "…"
                            : summary?.nextReturnDate
                                ? new Date(summary.nextReturnDate).toLocaleDateString()
                                : "—"
                    }
                    icon={<BadgeAlert className="h-5 w-5 text-primary" />}
                />
                <KpiCard
                    title="Last Payment"
                    value={
                        loadingSummary
                            ? "…"
                            : summary?.lastPayment
                                ? `₹${formatINR(summary.lastPayment.amount)}`
                                : "—"
                    }
                    icon={<Wallet className="h-5 w-5 text-primary" />}
                />
            </div>

            {/* Current rental */}
            <Card className="rounded-2xl border">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Your Current Rental</CardTitle>
                    {current?.status && (
                        <Badge
                            variant={
                                current.status === "RETURN_REQUESTED" ? "destructive" : "secondary"
                            }
                            className="capitalize"
                        >
                            {current.status.replace("_", " ").toLowerCase()}
                        </Badge>
                    )}
                </CardHeader>
                <CardContent>
                    {loadingRentals ? (
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Skeleton className="h-40 w-full rounded-xl" />
                            <div className="col-span-2 space-y-3">
                                <Skeleton className="h-5 w-2/3" />
                                <Skeleton className="h-5 w-1/2" />
                                <Skeleton className="h-5 w-1/3" />
                                <Skeleton className="h-10 w-1/2" />
                            </div>
                        </div>
                    ) : current ? (
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted sm:aspect-[4/3]">
                                <Image
                                    src={current.vehicle.image || "/images/vehicles/placeholder.webp"}
                                    alt={current.vehicle.model}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="col-span-2 space-y-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-semibold">{current.vehicle.model}</h3>
                                    {current.vehicle.planName && (
                                        <Badge className="bg-secondary text-secondary-foreground">
                                            {current.vehicle.planName}
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {new Date(current.startDate).toLocaleDateString()} —{" "}
                                    {new Date(current.endDate).toLocaleDateString()}
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>Rate/Day</div>
                                    <div className="text-right font-medium">
                                        ₹{current.vehicle?.rentPerDay}
                                    </div>
                                    <div>Paid</div>
                                    <div className="text-right font-medium">
                                        ₹{formatINR(current.paidTotal)}
                                    </div>
                                    <div>Balance</div>
                                    <div className="text-right font-bold text-destructive">
                                        ₹{formatINR(current.balanceDue)}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Button
                                        className="rounded-xl"
                                        onClick={() => {
                                            setPayAmount(Math.max(0, current.balanceDue));
                                            setPayOpen(true);
                                        }}
                                    >
                                        Pay Due
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="rounded-xl"
                                        onClick={() => setExtendOpen(true)}
                                    >
                                        <CalendarPlus className="mr-2 h-4 w-4" />
                                        Extend
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="rounded-xl"
                                        onClick={() => setReturnOpen(true)}
                                    >
                                        Request Return
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <EmptyCurrent />
                    )}
                </CardContent>
            </Card>

            {/* PAY DUE */}
            <Dialog open={payOpen} onOpenChange={setPayOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pay outstanding balance</DialogTitle>
                        <DialogDescription>
                            Pay in full or a partial amount.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input
                            id="amount"
                            type="number"
                            min={1}
                            value={payAmount}
                            onChange={(e) => setPayAmount(parseInt(e.target.value || "0", 10))}
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setPayAmount(Math.max(0, current?.balanceDue || 0))}
                            >
                                Full
                            </Button>
                            <Button variant="outline" onClick={() => setPayAmount(1000)}>
                                ₹1,000
                            </Button>
                            <Button variant="outline" onClick={() => setPayAmount(2000)}>
                                ₹2,000
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="rounded-xl" onClick={onPay}>
                            Continue to Pay
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* EXTEND */}
            <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Extend your rental</DialogTitle>
                        <DialogDescription>Select a new end date.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Label htmlFor="end-date">New End Date</Label>
                        <Input
                            id="end-date"
                            type="date"
                            value={extendDate}
                            onChange={(e) => setExtendDate(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button className="rounded-xl" onClick={onExtend}>
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* RETURN */}
            <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Request return</DialogTitle>
                        <DialogDescription>Tell us anything we should know.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Label htmlFor="note">Note</Label>
                        <Input
                            id="note"
                            value={returnNote}
                            onChange={(e) => setReturnNote(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button className="rounded-xl" variant="secondary" onClick={onReturn}>
                            Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function KpiCard({
                     title,
                     value,
                     icon,
                     right,
                 }: {
    title: string;
    value: string;
    icon?: React.ReactNode;
    right?: React.ReactNode;
}) {
    return (
        <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    {icon} {title}
                </CardTitle>
                {right}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

function EmptyCurrent() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Image
                src="/images/empty-rental.svg"
                alt="No rentals"
                width={160}
                height={120}
            />
            <p className="text-muted-foreground">No active rental right now.</p>
            <Button className="rounded-xl" asChild>
                <a href="/book">Book a vehicle</a>
            </Button>
        </div>
    );
}
