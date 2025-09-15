// app/admin/reports/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "@/components/ui/pagination";

type Summary = {
    from: string; to: string;
    totalRentalsCreated: number;
    ongoing: number; overdue: number; completed: number;
    revenue: number; receivables: number;
};

type RentalsRow = {
    rentalId: number;
    rider: { riderId: number; fullName: string; phone: string };
    vehicle: { vehicleId: number; uniqueCode: string; model: string };
    startDate: string; actualReturnDate: string | null;
    status: string; payableTotal: number; paidTotal: number; balanceDue: number;
};

type PaymentsRow = {
    paymentId: number; rentalId: number;
    rider: { riderId: number; fullName: string; phone: string };
    amount: number; paymentMethod: string; txnRef: string | null;
    transactionStatus: string; transactionDate: string;
};

type VehicleRow = {
    vehicleId: number; uniqueCode: string; model: string;
    trips: number; rentedDays: number; revenue: number; utilization: number;
};

const fmtINR = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
function daysAgoISO(n: number) { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0,10); }

// Build a RELATIVE URL string (no window usage)
function buildUrl(path: string, params: Record<string, string | number | undefined | null>) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && String(v) !== "") search.set(k, String(v));
    }
    const qs = search.toString();
    return qs ? `${path}?${qs}` : path;
}

export default function ReportsPage() {
    // filters
    const [from, setFrom] = useState(daysAgoISO(29));
    const [to, setTo]     = useState(todayISO());
    const [tab, setTab]   = useState<"rentals"|"payments"|"vehicles">("rentals");
    const [status, setStatus] = useState<string>("");      // rentals status
    const [payStatus, setPayStatus] = useState<string>(""); // payment status
    const [method, setMethod] = useState<string>("");       // payment method
    const [q, setQ] = useState("");

    // summary
    const [summary, setSummary] = useState<Summary | null>(null);

    // list state
    const [rows, setRows] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 12;

    useEffect(() => {
        (async () => {
            const url = buildUrl("/api/v1/admin/reports/summary", { from, to });
            const res = await fetch(url, { cache: "no-store" });
            const j = await res.json();
            if (j.ok) setSummary(j.data as Summary);
        })();
    }, [from, to]);

    useEffect(() => {
        (async () => {
            const base =
                tab === "rentals"
                    ? "/api/v1/admin/reports/rentals"
                    : tab === "payments"
                        ? "/api/v1/admin/reports/payments"
                        : "/api/v1/admin/reports/vehicles";

            const params: Record<string, string | number | undefined> = {
                from, to, page, pageSize, q: q || undefined,
            };
            if (tab === "rentals" && status) params.status = status;
            if (tab === "payments") {
                if (method) params.method = method;
                if (payStatus) params.status = payStatus;
            }

            const url = buildUrl(base, params);
            const res = await fetch(url, { cache: "no-store" });
            const j = await res.json();
            if (j.ok) { setRows(j.data || []); setTotal(j.total || 0); }
            else { setRows([]); setTotal(0); }
        })();
    }, [tab, from, to, q, page, status, payStatus, method]);

    useEffect(() => { setPage(1); }, [tab, from, to, q, status, payStatus, method]); // reset page on filter change

    const exportHref = useMemo(() => {
        const base =
            tab === "rentals"
                ? "/api/v1/admin/reports/rentals"
                : tab === "payments"
                    ? "/api/v1/admin/reports/payments"
                    : "/api/v1/admin/reports/vehicles";
        const params: Record<string, string | number | undefined> = {
            from, to, page: 1, pageSize: 1000, q: q || undefined,
        };
        if (tab === "rentals" && status) params.status = status;
        if (tab === "payments") {
            if (method) params.method = method;
            if (payStatus) params.status = payStatus;
        }
        return buildUrl(base, params);
    }, [tab, from, to, q, status, payStatus, method]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Build page items with ellipses: 1 … (p-1) p (p+1) … last
    function pageSequence(curr: number, last: number): (number | "…")[] {
        if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
        const items: (number | "…")[] = [1];
        const left = Math.max(2, curr - 1);
        const right = Math.min(last - 1, curr + 1);
        if (left > 2) items.push("…");
        for (let n = left; n <= right; n++) items.push(n);
        if (right < last - 1) items.push("…");
        items.push(last);
        return items;
    }
    const pages = pageSequence(page, totalPages);

    return (
        <div className="px-4 py-6 space-y-6">
            {/* Filters */}
            <Card className="rounded-2xl">
                <CardContent className="p-4 md:p-6 flex flex-col gap-4 md:gap-0 md:flex-row md:items-end md:justify-between">
                    <div className="flex flex-col md:flex-row gap-3 md:items-end">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">From</label>
                            <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="border rounded px-3 py-2 w-[180px]" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">To</label>
                            <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="border rounded px-3 py-2 w-[180px]" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Search</label>
                            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="rider, vehicle, id..." className="border rounded px-3 py-2 w-[220px]" />
                        </div>

                        {tab === "rentals" && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Status</label>
                                <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border rounded px-3 py-2 w-[160px]">
                                    <option value="">All</option>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        )}

                        {tab === "payments" && (
                            <>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Method</label>
                                    <select value={method} onChange={(e)=>setMethod(e.target.value)} className="border rounded px-3 py-2 w-[160px]">
                                        <option value="">All</option>
                                        <option value="CASH">Cash</option>
                                        <option value="CARD">Card</option>
                                        <option value="UPI">UPI</option>
                                        <option value="BANK">Bank</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                                    <select value={payStatus} onChange={(e)=>setPayStatus(e.target.value)} className="border rounded px-3 py-2 w-[160px]">
                                        <option value="">All</option>
                                        <option value="SUCCESS">Success</option>
                                        <option value="FAILED">Failed</option>
                                        <option value="PENDING">Pending</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant={tab==="rentals" ? "default" : "outline"} onClick={()=>setTab("rentals")}>Rentals</Button>
                        <Button variant={tab==="payments" ? "default" : "outline"} onClick={()=>setTab("payments")}>Payments</Button>
                        <Button variant={tab==="vehicles" ? "default" : "outline"} onClick={()=>setTab("vehicles")}>Vehicles</Button>
                        <a href={exportHref}>
                            <Button variant="outline">Export</Button>
                        </a>
                    </div>
                </CardContent>
            </Card>

            {/* KPIs */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <KPI title="Rentals (created)" value={summary.totalRentalsCreated} />
                    <KPI title="Ongoing" value={summary.ongoing} />
                    <KPI title="Overdue" value={summary.overdue} tone="destructive" />
                    <KPI title="Completed" value={summary.completed} />
                    <KPI title="Revenue" value={fmtINR(summary.revenue)} />
                    <KPI title="Receivables" value={fmtINR(summary.receivables)} />
                </div>
            )}

            {/* Tables */}
            <Card className="rounded-2xl">
                <CardContent className="p-0">
                    <ScrollArea className="w-full h-[520px]">
                        <Table className="text-[15px]">
                            <TableHeader>
                                {tab === "rentals" && (
                                    <TableRow className="bg-muted sticky top-0 z-10">
                                        <TableHead>Rental</TableHead>
                                        <TableHead>Rider</TableHead>
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Start</TableHead>
                                        <TableHead>Return</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Payable</TableHead>
                                        <TableHead className="text-right">Paid</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                    </TableRow>
                                )}
                                {tab === "payments" && (
                                    <TableRow className="bg-muted sticky top-0 z-10">
                                        <TableHead>Payment</TableHead>
                                        <TableHead>Rental</TableHead>
                                        <TableHead>Rider</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Txn Ref</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                )}
                                {tab === "vehicles" && (
                                    <TableRow className="bg-muted sticky top-0 z-10">
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Model</TableHead>
                                        <TableHead>Trips</TableHead>
                                        <TableHead>Rented Days</TableHead>
                                        <TableHead>Utilization</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                    </TableRow>
                                )}
                            </TableHeader>

                            <TableBody>
                                {/* Rentals */}
                                {tab === "rentals" && (rows as RentalsRow[]).map(r => (
                                    <TableRow key={r.rentalId}>
                                        <TableCell>#{r.rentalId}</TableCell>
                                        <TableCell>{r.rider.fullName} <span className="text-xs text-muted-foreground">({r.rider.phone})</span></TableCell>
                                        <TableCell>{r.vehicle.uniqueCode} <span className="text-xs text-muted-foreground">· {r.vehicle.model}</span></TableCell>
                                        <TableCell>{new Date(r.startDate).toLocaleString()}</TableCell>
                                        <TableCell>{r.actualReturnDate ? new Date(r.actualReturnDate).toLocaleString() : "-"}</TableCell>
                                        <TableCell className="capitalize">{r.status}</TableCell>
                                        <TableCell className="text-right">{fmtINR(r.payableTotal)}</TableCell>
                                        <TableCell className="text-right">{fmtINR(r.paidTotal)}</TableCell>
                                        <TableCell className="text-right">{fmtINR(r.balanceDue)}</TableCell>
                                    </TableRow>
                                ))}

                                {/* Payments */}
                                {tab === "payments" && (rows as PaymentsRow[]).map(p => (
                                    <TableRow key={p.paymentId}>
                                        <TableCell>#{p.paymentId}</TableCell>
                                        <TableCell>#{p.rentalId}</TableCell>
                                        <TableCell>{p.rider.fullName} <span className="text-xs text-muted-foreground">({p.rider.phone})</span></TableCell>
                                        <TableCell>{p.paymentMethod}</TableCell>
                                        <TableCell>{p.transactionStatus}</TableCell>
                                        <TableCell>{p.txnRef || "-"}</TableCell>
                                        <TableCell>{new Date(p.transactionDate).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{fmtINR(p.amount)}</TableCell>
                                    </TableRow>
                                ))}

                                {/* Vehicles */}
                                {tab === "vehicles" && (rows as VehicleRow[]).map(v => (
                                    <TableRow key={v.vehicleId}>
                                        <TableCell>{v.uniqueCode}</TableCell>
                                        <TableCell>{v.model}</TableCell>
                                        <TableCell>{v.trips}</TableCell>
                                        <TableCell>{v.rentedDays}</TableCell>
                                        <TableCell>{(v.utilization*100).toFixed(1)}%</TableCell>
                                        <TableCell className="text-right">{fmtINR(v.revenue)}</TableCell>
                                    </TableRow>
                                ))}

                                {rows.length === 0 && (
                                    <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">No data</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>

                    {/* Pagination */}
                    <div className="p-3">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                                        onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}
                                    />
                                </PaginationItem>

                                {pageSequence(page, totalPages).map((it, idx) =>
                                    it === "…" ? (
                                        <PaginationItem key={`e-${idx}`}>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    ) : (
                                        <PaginationItem key={it}>
                                            <PaginationLink
                                                href="#"
                                                isActive={it === page}
                                                onClick={(e) => { e.preventDefault(); setPage(it as number); }}
                                            >
                                                {it}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )
                                )}

                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                                        onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function KPI({ title, value, tone }: { title: string; value: React.ReactNode; tone?: "destructive" | "default" }) {
    return (
        <Card className={`rounded-2xl ${tone==="destructive" ? "border-red-200 bg-red-50/40" : ""}`}>
            <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{title}</div>
                <div className="text-xl font-bold mt-1">{value}</div>
            </CardContent>
        </Card>
    );
}