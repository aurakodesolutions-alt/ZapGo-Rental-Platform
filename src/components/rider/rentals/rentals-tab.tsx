"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

type UiRental = {
    rentalId: number | string;
    vehicle: { id: number | string; model: string; planName?: string; image?: string };
    startDate: string;
    endDate: string;
    ratePerDay: number;
    deposit: number;
    paidTotal: number;
    balanceDue: number;
    status: "CONFIRMED" | "ONGOING" | "RETURN_REQUESTED" | "COMPLETED" | "CANCELLED";
};

const fetcher = (url: string) =>
    fetch(url).then(async (r) => {
        const txt = await r.text();
        const json = txt ? JSON.parse(txt) : null;
        if (!r.ok) {
            throw new Error((json && (json.error || json.message)) || `Request failed: ${r.status}`);
        }
        return json;
    });

const formatINR = (n?: number) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

function mapRentals(raw: any): UiRental[] {
    const src: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    return src.map((r: any) => {
        const statusRaw = String(r.status ?? r.Status ?? "CONFIRMED").toUpperCase();
        const status =
            (["CONFIRMED", "ONGOING", "RETURN_REQUESTED", "COMPLETED", "CANCELLED"].includes(statusRaw)
                ? statusRaw
                : "CONFIRMED") as UiRental["status"];

        const vehicle = r.vehicle || {};
        const images = vehicle.images || r.images || [];
        const firstImage =
            (Array.isArray(images) && images[0]) || vehicle.image || "";

        return {
            rentalId: r.rentalId ?? r.RentalId ?? r.id,
            vehicle: {
                id: vehicle.id ?? r.VehicleId,
                model: vehicle.model ?? r.Model ?? "Scooter",
                planName: vehicle.planName ?? r.plan?.name ?? r.PlanName ?? undefined,
                image: firstImage,
            },
            startDate: r.startDate ?? r.StartDate,
            endDate: r.endDate ?? r.ExpectedReturnDate ?? r.EndDate,
            ratePerDay: Number(r.ratePerDay ?? r.RatePerDay ?? 0),
            deposit: Number(r.deposit ?? r.Deposit ?? 0),
            paidTotal: Number(r.paidTotal ?? r.PaidTotal ?? 0),
            balanceDue: Number(r.balanceDue ?? r.BalanceDue ?? 0),
            status,
        };
    });
}

export default function RentalsTab() {
    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [status, setStatus] = useState<string>("");

    const url = useMemo(() => {
        const s = new URLSearchParams({ page: String(page), pageSize: "10" });
        if (q) s.set("q", q);
        if (status) s.set("status", status);
        return `/api/v1/rider/rentals?${s.toString()}`;
    }, [page, q, status]);

    const { data: raw, isLoading } = useSWR(url, fetcher);
    const items: UiRental[] = useMemo(() => mapRentals(raw), [raw]);

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <Card className="rounded-2xl">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search vehicle model…"
                                className="pl-8"
                                value={q}
                                onChange={(e) => {
                                    setQ(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    setPage(1);
                                }}
                                className="h-10 rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">All statuses</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="ONGOING">Ongoing</option>
                                <option value="RETURN_REQUESTED">Return requested</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setQ("");
                                    setStatus("");
                                    setPage(1);
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="rounded-2xl">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead className="text-right">Rate/Day</TableHead>
                                <TableHead className="text-right">Paid</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7}>
                                            <Skeleton className="h-10 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : items.length ? (
                                items.map((r) => (
                                    <TableRow key={r.rentalId}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{r.vehicle.model}</span>
                                                {r.vehicle.planName ? (
                                                    <span className="text-xs text-muted-foreground">
                            {r.vehicle.planName}
                          </span>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(r.startDate).toLocaleDateString()} –{" "}
                                            {new Date(r.endDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">₹{formatINR(r.ratePerDay)}</TableCell>
                                        <TableCell className="text-right">₹{formatINR(r.paidTotal)}</TableCell>
                                        <TableCell className="text-right">
                      <span className={r.balanceDue > 0 ? "text-destructive font-medium" : ""}>
                        ₹{formatINR(r.balanceDue)}
                      </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="capitalize">
                                                {r.status.toLowerCase().replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" asChild className="rounded-xl">
                                                    <a href={`/booking/${r.rentalId}`}>View</a>
                                                </Button>
                                                <Button size="sm" className="rounded-xl" asChild>
                                                    <a href={`/rider/pay?rental=${r.rentalId}`}>Pay Due</a>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                        No rentals found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Separator />
                    <div className="flex items-center justify-between p-3">
                        <div className="text-xs text-muted-foreground">Page {page}</div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setPage((p) => p + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
