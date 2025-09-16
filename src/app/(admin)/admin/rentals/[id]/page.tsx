'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Printer, RotateCcw } from 'lucide-react';
import QRCode from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useMiscInventory } from '@/hooks/api/use-misc-inventory';


import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatINR, formatIST } from '@/lib/format';
import {Separator} from "@/components/ui/separator";

type RentalStatus = 'confirmed'|'ongoing' | 'completed' | 'overdue' | 'cancelled' | string;

type Rental = {
    rentalId: number;
    riderId: number;
    vehicleId: number;
    planId: number;
    startDate: string | null;
    expectedReturnDate: string | null;
    actualReturnDate?: string | null;
    status: RentalStatus;
    ratePerDay: number;
    deposit: number;
    pricingJson?: any;
    payableTotal: number;
    paidTotal: number;
    balanceDue: number;
    createdAt: string | null;
    updatedAt: string | null;
    rider?: { name: string | null; phone: string | null };
    vehicle?: { code: string | null; model: string | null };
    plan?: { name: string | null };
};

type Payment = {
    paymentId: number;
    amount: number;
    method: string | null;
    txnRef: string | null;
    transactionStatus: string | null;
    transactionDate: string | null;
    createdAt: string | null;
};

export default function RentalDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [rental, setRental] = React.useState<Rental | null>(null);
    const [payments, setPayments] = React.useState<Payment[]>([]);
    const { batteries, chargers, isLoading: invLoading, mutate: refreshInv } = useMiscInventory();

    const [startAmount, setStartAmount] = React.useState<number>(0);
    const [startMethod, setStartMethod] = React.useState<"CASH"|"UPI">("UPI");
    const [upiId, setUpiId] = React.useState<string>("merchant@upi"); // admin can edit
    const [txnRef, setTxnRef] = React.useState<string>("");

    const [batteryId, setBatteryId] = React.useState<number | null>(null);
    const [chargerId, setChargerId] = React.useState<number | null>(null);
    const [accessoriesNotes, setAccessoriesNotes] = React.useState<string>("");

    const upiUrl = React.useMemo(() => {
        const pa = encodeURIComponent(upiId || "");
        const pn = encodeURIComponent("ZapGo Rentals");
        const am = startAmount > 0 ? `&am=${encodeURIComponent(String(startAmount))}` : "";
        const tn = encodeURIComponent(`Rental ${params.id}`);
        return `upi://pay?pa=${pa}&pn=${pn}${am}&cu=INR&tn=${tn}`;
    }, [upiId, startAmount, params.id]);


    const load = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/v1/admin/rentals/${id}`, { cache: 'no-store' });
            const json = await res.json();
            if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to fetch rental');
            setRental(json.data.rental);
            setPayments(json.data.payments ?? []);
        } catch (e: any) {
            setError(String(e?.message || e));
        } finally {
            setLoading(false);
        }
    }, [id]);

    React.useEffect(() => { load(); }, [load]);

    const handleStartRental = async () => {
        if (!rental) return;
        try {
            if (!(startAmount > 0)) throw new Error("Enter amount to collect");
            const res = await fetch(`/api/v1/admin/rentals/${rental.rentalId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'start',
                    payment: {
                        amount: startAmount,
                        method: startMethod,
                        txnRef: txnRef || null,
                    },
                    accessories: {
                        batteryIds: batteryId ? [batteryId] : [],
                        chargerIds: chargerId ? [chargerId] : [],
                        notes: accessoriesNotes || undefined,
                    }
                })
            });
            const json = await res.json();
            if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to start rental");

            toast({ title: 'Rental started', description: 'Status changed to ongoing.' });
            await load();
            await refreshInv(); // refresh accessory availability
        } catch (e: any) {
            toast({ title: 'Error', description: String(e?.message || e), variant: 'destructive' });
        }
    };


    const handleReturn = async () => {
        if (!confirm('Mark this rental as returned?')) return;
        try {
            const res = await fetch(`/api/v1/admin/rentals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'return' }),
            });
            const json = await res.json();
            if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to mark as returned');
            toast({ title: 'Vehicle Returned', description: 'Rental marked as completed.' });
            await load();
            router.refresh?.();
        } catch (e: any) {
            toast({ title: 'Error', description: String(e?.message || e), variant: 'destructive' });
        }
    };

    const handleCollectPayment = () => {
        if (!rental) return;
        router.push(`/admin/payments/new?rentalId=${rental.rentalId}&amount=${rental.balanceDue}`);
    };

    const statusBadge = (s?: string | null) => {
        const v = (s || '').toLowerCase();
        if (v === 'completed') return <Badge variant="default">completed</Badge>;
        if (v === 'overdue') return <Badge variant="destructive">overdue</Badge>;
        if (v === 'cancelled') return <Badge variant="outline">cancelled</Badge>;
        return <Badge className={cn('bg-blue-500 text-white')}>ongoing</Badge>;
    };

    if (loading) {
        return <div className="p-6 text-sm text-muted-foreground">Loading rental…</div>;
    }
    if (error || !rental) {
        return (
            <div className="p-6 text-sm text-destructive">
                {error || 'Rental not found.'}
                <div className="mt-3">
                    <Button variant="outline" asChild>
                        <Link href="/admin/rentals"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Rentals</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Rental #${rental.rentalId}`}
                description={`Manage rental for ${rental.rider?.name ?? 'rider'}.`}
            >
                <Button variant="outline" asChild>
                    <Link href="/admin/rentals"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Rentals</Link>
                </Button>
            </PageHeader>

            <div className="grid gap-6 md:grid-cols-3">
                {/* LEFT: Summary + Timeline */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rental Summary</CardTitle>
                            <CardDescription>
                                Status:&nbsp;{statusBadge(rental.status)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <h4 className="font-semibold">Rider</h4>
                                {rental.rider?.name ? (
                                    <Link href={`/admin/riders/${rental.riderId}`} className="text-primary hover:underline">
                                        {rental.rider.name}
                                    </Link>
                                ) : <span>—</span>}
                                <p className="text-sm text-muted-foreground">{rental.rider?.phone ?? '—'}</p>
                            </div>

                            <div>
                                <h4 className="font-semibold">Vehicle</h4>
                                {rental.vehicle?.code ? (
                                    <Link href={`/admin/vehicles/${rental.vehicleId}`} className="text-primary hover:underline">
                                        {rental.vehicle.code}
                                    </Link>
                                ) : <span>—</span>}
                                <p className="text-sm text-muted-foreground">{rental.vehicle?.model ?? '—'}</p>
                            </div>

                            <div>
                                <h4 className="font-semibold">Plan</h4>
                                <p>{rental.plan?.name ?? `#${rental.planId}`}</p>
                            </div>

                            <div>
                                <h4 className="font-semibold">Rental Period</h4>
                                <p>
                                    {rental.startDate ? formatIST(rental.startDate) : '—'}&nbsp;–&nbsp;
                                    {rental.expectedReturnDate ? formatIST(rental.expectedReturnDate) : '—'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                {rental.createdAt && (
                                    <li className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <span>Rental created on {formatIST(rental.createdAt)}</span>
                                    </li>
                                )}

                                {payments.map((p) => (
                                    <li key={p.paymentId} className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        <span>
                      Payment of {formatINR(p.amount)} received on {p.transactionDate ? formatIST(p.transactionDate) : '—'}
                                            {p.method ? ` via ${p.method}` : ''}{p.txnRef ? ` (ref: ${p.txnRef})` : ''}
                    </span>
                                    </li>
                                ))}

                                {rental.actualReturnDate && (
                                    <li className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-gray-500" />
                                        <span>Vehicle returned on {formatIST(rental.actualReturnDate)}</span>
                                    </li>
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT: Money + Actions */}
                <div className="space-y-6">
                    {String(rental.status).toLowerCase() === 'confirmed' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Start Rental (collect payment)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Accessories */}
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Accessories</div>
                                    <div className="grid gap-3">
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-1">Battery</div>
                                            <Select
                                                onValueChange={(v) => setBatteryId(v ? Number(v) : null)}
                                                disabled={invLoading}
                                            >
                                                <SelectTrigger><SelectValue placeholder={invLoading ? "Loading…" : "Select battery"} /></SelectTrigger>
                                                <SelectContent>
                                                    {batteries.map(b => (
                                                        <SelectItem key={b.itemId} value={String(b.itemId)}>
                                                            {b.serialNumber || `Battery #${b.itemId}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-1">Charger</div>
                                            <Select
                                                onValueChange={(v) => setChargerId(v ? Number(v) : null)}
                                                disabled={invLoading}
                                            >
                                                <SelectTrigger><SelectValue placeholder={invLoading ? "Loading…" : "Select charger"} /></SelectTrigger>
                                                <SelectContent>
                                                    {chargers.map(c => (
                                                        <SelectItem key={c.itemId} value={String(c.itemId)}>
                                                            {c.serialNumber || `Charger #${c.itemId}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Input
                                            placeholder="Extra items / notes"
                                            value={accessoriesNotes}
                                            onChange={(e) => setAccessoriesNotes(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Payment */}
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Collect Payment</div>
                                    <div className="grid gap-3">
                                        <Input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            placeholder="Amount (₹)"
                                            value={startAmount}
                                            onChange={(e) => setStartAmount(Number(e.target.value || 0))}
                                        />
                                        <Select onValueChange={(v) => setStartMethod(v as "CASH"|"UPI")} defaultValue="UPI">
                                            <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="UPI">UPI</SelectItem>
                                                <SelectItem value="CASH">Cash</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {startMethod === "UPI" && (
                                            <div className="space-y-2">
                                                <Input placeholder="Your UPI ID (receiver)" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                                                <div className="flex justify-center">
                                                    <QRCode value={upiUrl} size={160} />
                                                </div>
                                                <p className="text-[11px] text-muted-foreground break-all">
                                                    {upiUrl}
                                                </p>
                                            </div>
                                        )}

                                        <Input placeholder="Txn ref / notes (optional)" value={txnRef} onChange={(e) => setTxnRef(e.target.value)} />
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={handleStartRental}
                                    disabled={!(startAmount > 0)}
                                >
                                    Mark Paid & Start
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    You must record a payment before changing status to <b>ongoing</b>.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                    <Card className="bg-primary text-primary-foreground">
                        <CardHeader><CardTitle>Balance Due</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold font-code">{formatINR(rental.balanceDue)}</p>
                            <p className="text-sm">
                                Total: {formatINR(rental.payableTotal)} &nbsp;|&nbsp; Paid: {formatINR(rental.paidTotal)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Button onClick={handleCollectPayment} disabled={(rental.balanceDue ?? 0) <= 0}>
                                <CreditCard className="mr-2 h-4 w-4" /> Collect Payment
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleReturn}
                                disabled={String(rental.status).toLowerCase() === 'completed'}
                            >
                                <RotateCcw className="mr-2 h-4 w-4" /> Return Vehicle
                            </Button>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="secondary">
                                        <Printer className="mr-2 h-4 w-4" /> Print Receipt
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Rental Receipt #{rental.rentalId}</DialogTitle>
                                        <DialogDescription>{rental.rider?.name ?? ''}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4 text-sm">
                                        <p><strong>Company:</strong> ZapGo Rentals Pvt. Ltd.</p>
                                        <p><strong>Rider:</strong> {rental.rider?.name ?? '—'}</p>
                                        <p><strong>Vehicle:</strong> {rental.vehicle?.code ?? '—'} {rental.vehicle?.model ?? ''}</p>
                                        <p><strong>Total Amount:</strong> {formatINR(rental.payableTotal)}</p>
                                        <p><strong>Amount Paid:</strong> {formatINR(rental.paidTotal)}</p>
                                        <p className="font-bold"><strong>Balance Due:</strong> {formatINR(rental.balanceDue)}</p>
                                        <div className="flex justify-center pt-4">
                                            <QRCode value={`rental:${rental.rentalId}`} size={128} />
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
