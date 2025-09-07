"use client";

import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown } from "lucide-react";
import { formatINR, formatIST } from "@/lib/format";

type Row = {
    paymentId: number;
    rentalId: number;
    rider: { riderId: number; fullName: string; phone: string };
    amount: number;
    paymentMethod: string;
    txnRef?: string | null;
    transactionDate: string;
    transactionStatus: string;
};

export default function PaymentsPage() {
    const [rows, setRows] = React.useState<Row[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [q, setQ] = React.useState("");
    const [method, setMethod] = React.useState<string>("");
    const [status, setStatus] = React.useState<string>("");

    // simple debounce
    const debouncedQ = useDebounce(q, 300);

    // inside useEffect – build a relative URL
    React.useEffect(() => {
        let aborted = false;
        async function load() {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (debouncedQ) params.set("q", debouncedQ);
                if (method) params.set("method", method);
                if (status) params.set("status", status);
                params.set("limit", "100");

                const r = await fetch(`/api/v1/admin/payments?${params.toString()}`, { cache: "no-store" });
                const j = await r.json();
                if (!aborted && r.ok && j?.ok) setRows(j.data);
            } catch {
                if (!aborted) setRows([]);
            } finally {
                if (!aborted) setLoading(false);
            }
        }
        load();
        return () => { aborted = true; };
    }, [debouncedQ, method, status]);

// export CSV href – also build relative URL
    const exportCsvHref = React.useMemo(() => {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (method) params.set("method", method);
        if (status) params.set("status", status);
        params.set("format", "csv");
        return `/api/v1/admin/payments?${params.toString()}`;
    }, [q, method, status]);


    return (
        <>
            <PageHeader title="Payments" description="View and manage all payments.">
                <Button asChild variant="outline">
                    <a href={exportCsvHref}><FileDown className="mr-2 h-4 w-4" /> Export CSV</a>
                </Button>
            </PageHeader>

            <Card>
                <CardContent className="pt-6">
                    {/* Filters */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
                        <Input
                            className="sm:w-[360px]"
                            placeholder="Search rider / phone / txn ref / rental id…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <select
                                className="h-9 rounded-md border bg-background px-2 text-sm"
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                            >
                                <option value="">All Methods</option>
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="CARD">Card</option>
                                <option value="CASHFREE">Cashfree</option>
                            </select>
                            <select
                                className="h-9 rounded-md border bg-background px-2 text-sm"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="SUCCESS">Success</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Payment</TableHead>
                                <TableHead>Rider</TableHead>
                                <TableHead>Rental</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Txn Ref</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading
                                ? Array.from({ length: 10 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={8}>
                                            <Skeleton className="h-8 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                                : rows.length > 0
                                    ? rows.map((p) => (
                                        <TableRow key={p.paymentId}>
                                            <TableCell className="font-medium">#{p.paymentId}</TableCell>
                                            <TableCell>
                                                <div className="whitespace-nowrap">
                                                    {p.rider.fullName}
                                                    <div className="text-xs text-muted-foreground">{p.rider.phone}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/admin/rentals/${p.rentalId}`} className="text-primary hover:underline">
                                                    #{p.rentalId}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{p.paymentMethod}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        p.transactionStatus === "SUCCESS"
                                                            ? "default"
                                                            : p.transactionStatus === "PENDING"
                                                                ? "secondary"
                                                                : "destructive"
                                                    }
                                                >
                                                    {p.transactionStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[220px] truncate">{p.txnRef || "—"}</TableCell>
                                            <TableCell>{formatIST(p.transactionDate, "dd MMM yyyy, hh:mm a")}</TableCell>
                                            <TableCell className="text-right font-code">{formatINR(p.amount)}</TableCell>
                                        </TableRow>
                                    ))
                                    : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                                                No payments found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}

/* -------- tiny debounce hook -------- */
function useDebounce<T>(value: T, ms = 300) {
    const [v, setV] = React.useState(value);
    React.useEffect(() => {
        const id = setTimeout(() => setV(value), ms);
        return () => clearTimeout(id);
    }, [value, ms]);
    return v;
}
