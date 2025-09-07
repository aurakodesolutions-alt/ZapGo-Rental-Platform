"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { addDays, formatISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type UiPayment = {
    paymentId: number | string;
    rentalId: number | string;
    amount: number;
    method: "CASHFREE" | "RAZORPAY" | "UPI" | "CARD" | "NB" | "CASH";
    txnRef?: string | null;
    status: "SUCCESS" | "PENDING" | "FAILED";
    createdAt: string;
};

const fetcher = async (url: string) => {
    const r = await fetch(url);
    const txt = await r.text();
    const json = txt ? JSON.parse(txt) : null;
    if (!r.ok) throw new Error(json?.error || `Request failed (${r.status})`);
    return json;
};

const formatINR = (n?: number) =>
    Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

function mapPayments(raw: any): UiPayment[] {
    const src: any[] = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : [];

    const normalizeMethod = (m: any): UiPayment["method"] => {
        const v = String(m || "CASH").toUpperCase();
        if (v === "CASHFREE") return "CASHFREE";
        if (v === "RAZORPAY") return "RAZORPAY";
        if (v === "UPI") return "UPI";
        if (v === "CARD" || v === "CARDS") return "CARD";
        if (v === "NB" || v === "NETBANKING" || v === "NET_BANKING" || v === "NETBANK")
            return "NB";
        if (v === "CASH") return "CASH";
        return "CASH";
    };

    const normalizeStatus = (s: any): UiPayment["status"] => {
        const v = String(s || "SUCCESS").toUpperCase();
        if (v === "SUCCESS") return "SUCCESS";
        if (v === "FAILED") return "FAILED";
        return "PENDING";
    };

    return src.map((p: any): UiPayment => ({
        paymentId: (p.paymentId ?? p.PaymentId ?? p.id) as number | string,
        rentalId: (p.rentalId ?? p.RentalId) as number | string,
        amount: Number(p.amount ?? p.Amount ?? 0),
        method: normalizeMethod(p.method ?? p.PaymentMethod),
        txnRef: (p.txnRef ?? p.TxnRef ?? null) as string | null,
        status: normalizeStatus(p.status ?? p.TransactionStatus),
        createdAt: String(p.createdAt ?? p.TransactionDate ?? p.CreatedAt ?? ""),
    }));
}

export default function PaymentsTab() {
    const [range, setRange] = useState<"7d" | "30d" | "all">("7d");
    const [page, setPage] = useState(1);

    const query = useMemo(() => {
        const s = new URLSearchParams({ page: String(page), pageSize: "10" });
        if (range !== "all") {
            const to = new Date();
            const from = range === "7d" ? addDays(to, -7) : addDays(to, -30);
            s.set("from", formatISO(from, { representation: "date" }));
            s.set("to", formatISO(to, { representation: "date" }));
        }
        return s.toString();
    }, [range, page]);

    const { data: raw, isLoading } = useSWR(`/api/v1/rider/payments?${query}`, fetcher);
    const items: UiPayment[] = useMemo(() => mapPayments(raw), [raw]);
    const totalVisible = items.reduce(
        (sum, p) => sum + (p.status === "SUCCESS" ? p.amount : 0),
        0
    );

    return (
        <div className="space-y-4">
            <Card className="rounded-2xl">
                <CardContent className="flex items-center justify-between p-4">
                    <div className="flex gap-2">
                        <Button
                            variant={range === "7d" ? "default" : "outline"}
                            onClick={() => {
                                setRange("7d");
                                setPage(1);
                            }}
                            className="rounded-xl"
                        >
                            Last 7 days
                        </Button>
                        <Button
                            variant={range === "30d" ? "default" : "outline"}
                            onClick={() => {
                                setRange("30d");
                                setPage(1);
                            }}
                            className="rounded-xl"
                        >
                            Last 30 days
                        </Button>
                        <Button
                            variant={range === "all" ? "default" : "outline"}
                            onClick={() => {
                                setRange("all");
                                setPage(1);
                            }}
                            className="rounded-xl"
                        >
                            All
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Total received (visible):{" "}
                        <span className="font-semibold">₹{formatINR(totalVisible)}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Txn Ref</TableHead>
                                <TableHead>Rental</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}>
                                            <Skeleton className="h-10 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : items.length ? (
                                items.map((p) => (
                                    <TableRow key={p.paymentId}>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}
                                        </TableCell>
                                        <TableCell>₹{formatINR(p.amount)}</TableCell>
                                        <TableCell>{p.method}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    p.status === "SUCCESS"
                                                        ? "default"
                                                        : p.status === "FAILED"
                                                            ? "destructive"
                                                            : "secondary"
                                                }
                                                className="uppercase"
                                            >
                                                {p.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-code break-all text-xs">
                                            {p.txnRef || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <a className="text-primary underline" href={`/booking/${p.rentalId}`}>
                                                #{p.rentalId}
                                            </a>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                        No payments in this range.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Separator />
                    <div className="flex items-center justify-end gap-2 p-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="rounded-xl"
                        >
                            Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            className="rounded-xl"
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
