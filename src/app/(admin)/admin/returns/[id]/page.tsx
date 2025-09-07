"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { differenceInDays } from "date-fns";
import {
    ArrowLeft, Printer, Save, CheckCircle, Upload,
} from "lucide-react";
import QRCode from "qrcode.react";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatINR, formatIST } from "@/lib/format";

// ---- schema for the form (aligns with API)
const ReturnFormSchema = z.object({
    recoveryType: z.string().optional(),
    odometerEnd: z.coerce.number().default(0),
    chargePercent: z.coerce.number().min(0).max(100).default(100),
    accessoriesReturned: z.object({
        helmet: z.boolean().default(true),
        charger: z.boolean().default(true),
        phoneHolder: z.boolean().default(false),
        others: z.string().optional(),
    }).partial().default({}),
    isBatteryMissing: z.boolean().default(false),

    missingItemsCharge: z.coerce.number().default(0),
    cleaningFee: z.coerce.number().default(0),
    damageFee: z.coerce.number().default(0),
    otherAdjustments: z.coerce.number().default(0),
    taxPercent: z.coerce.number().default(18),

    // derived fields we still send to server (server doesn’t *trust* them for settlement)
    lateDays: z.coerce.number().default(0),
    lateFee: z.coerce.number().default(0),
    subtotal: z.coerce.number().default(0),
    taxAmount: z.coerce.number().default(0),
    totalDue: z.coerce.number().default(0),
    depositHeld: z.coerce.number().default(0),
    depositReturn: z.coerce.number().default(0),
    finalAmount: z.coerce.number().default(0),

    remarks: z.string().optional(),
});

type ReturnFormValues = z.infer<typeof ReturnFormSchema>;

type RentalSummary = {
    rentalId: number;
    rider: { riderId: number; fullName: string; phone: string };
    vehicle: { vehicleId: number; uniqueCode: string; model: string };
    plan: { planId: number; planName: string };
    startDate: string;
    expectedReturnDate: string;
    actualReturnDate: string | null;
    status: string;
    payableTotal: number;
    paidTotal: number;
    balanceDue: number;
};

export default function ReturnDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [rental, setRental] = useState<RentalSummary | null>(null);
    const [settings, setSettings] = useState<{ companyName: string; lateFeeEnabled: boolean; lateFeePerDay: number; taxPercentDefault: number } | null>(null);
    const [inspection, setInspection] = useState<any | null>(null);

    const form = useForm<ReturnFormValues>({
        resolver: zodResolver(ReturnFormSchema),
        defaultValues: {
            odometerEnd: 0,
            chargePercent: 100,
            accessoriesReturned: { helmet: true, charger: true, phoneHolder: false },
            isBatteryMissing: false,
            missingItemsCharge: 0,
            cleaningFee: 0,
            damageFee: 0,
            otherAdjustments: 0,
            taxPercent: 18,
        },
    });

    // Load data
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const res = await fetch(`/api/v1/admin/returns/${params.id}`);
            const j = await res.json();
            if (!res.ok || !j?.ok) {
                setLoading(false);
                notFound();
                return;
            }
            if (cancelled) return;

            setRental(j.data.rental);
            setSettings(j.data.settings);
            setInspection(j.data.inspection ?? null);

            const init: Partial<ReturnFormValues> = j.data.inspection
                ? {
                    recoveryType: j.data.inspection.recoveryType ?? undefined,
                    odometerEnd: j.data.inspection.odometerEnd ?? 0,
                    chargePercent: j.data.inspection.chargePercent ?? 100,
                    accessoriesReturned: j.data.inspection.accessoriesReturned || { helmet: true, charger: true, phoneHolder: false },
                    isBatteryMissing: !!j.data.inspection.isBatteryMissing,
                    missingItemsCharge: j.data.inspection.missingItemsCharge ?? 0,
                    cleaningFee: j.data.inspection.cleaningFee ?? 0,
                    damageFee: j.data.inspection.damageFee ?? 0,
                    otherAdjustments: j.data.inspection.otherAdjustments ?? 0,
                    taxPercent: j.data.inspection.taxPercent ?? (j.data.settings?.taxPercentDefault ?? 18),
                    lateDays: j.data.inspection.lateDays ?? 0,
                    lateFee: j.data.inspection.lateFee ?? 0,
                    subtotal: j.data.inspection.subtotal ?? 0,
                    taxAmount: j.data.inspection.taxAmount ?? 0,
                    totalDue: j.data.inspection.totalDue ?? 0,
                    depositHeld: j.data.inspection.depositHeld ?? 0,
                    depositReturn: j.data.inspection.depositReturn ?? 0,
                    finalAmount: j.data.inspection.finalAmount ?? 0,
                    remarks: j.data.inspection.remarks ?? "",
                }
                : {
                    accessoriesReturned: { helmet: true, charger: true, phoneHolder: false },
                    taxPercent: j.data.settings?.taxPercentDefault ?? 18,
                };

            form.reset(init);
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [params.id, form]);

    // Derived amounts shown in the UI
    const watched = form.watch();
    const lateDays = useMemo(() => {
        if (!rental) return 0;
        return rental.status === "overdue"
            ? Math.max(0, differenceInDays(new Date(), new Date(rental.expectedReturnDate)))
            : 0;
    }, [rental]);

    const lateFee = useMemo(() => {
        if (!settings?.lateFeeEnabled) return 0;
        return lateDays * (settings?.lateFeePerDay || 0);
    }, [lateDays, settings]);

    const charges =
        (watched.missingItemsCharge || 0) +
        (watched.cleaningFee || 0) +
        (watched.damageFee || 0) +
        lateFee +
        (watched.otherAdjustments || 0);

    const subtotal = charges;
    const taxAmount = subtotal * ((watched.taxPercent || 0) / 100);
    const totalDue = subtotal + taxAmount + (rental?.balanceDue || 0);
    const finalAmount = totalDue; // (no deposit-release logic here; add if needed)

    async function handleSave(values: ReturnFormValues) {
        if (!rental) return;
        try {
            const payload = {
                ...values,
                lateDays, lateFee,
                subtotal, taxAmount, totalDue, finalAmount,
            };

            const r = await fetch(`/api/v1/admin/returns/${rental.rentalId}/inspection`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const j = await r.json();
            if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");

            setInspection({ ...(inspection || {}), returnInspectionId: j.data.returnInspectionId, settled: false });
            toast({ title: "Draft saved", description: "Return inspection saved." });
        } catch (e: any) {
            toast({ title: "Error", description: String(e?.message || e), variant: "destructive" });
        }
    }

    async function handleSettle() {
        if (!rental) return;
        if (finalAmount > 0.0001) {
            toast({ title: "Collect payment", description: "Please settle outstanding amount before closing the return.", variant: "destructive" });
            return;
        }
        try {
            const r = await fetch(`/api/v1/admin/returns/${rental.rentalId}/settle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ issueNoc: true }), // toggle as you like
            });
            const j = await r.json();
            if (!r.ok || !j?.ok) throw new Error(j?.error || "Settle failed");

            toast({ title: "Return settled", description: "Rental marked completed and vehicle returned to stock." });
            router.push("/admin/returns");
            router.refresh();
        } catch (e: any) {
            toast({ title: "Error", description: String(e?.message || e), variant: "destructive" });
        }
    }

    if (loading || !rental || !settings) {
        return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
    }

    return (
        <Form {...form}>
            <div className="space-y-6">
                <PageHeader
                    title={`Process Return #${rental.rentalId}`}
                    description={`Rider: ${rental.rider.fullName} | Vehicle: ${rental.vehicle.uniqueCode} (${rental.vehicle.model})`}
                >
                    <Button variant="outline" asChild>
                        <Link href="/admin/returns"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Returns</Link>
                    </Button>
                </PageHeader>

                <form onSubmit={form.handleSubmit(handleSave)} className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Rental Summary</CardTitle></CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div><h4 className="font-semibold">Period</h4><p>{formatIST(rental.startDate)} — {formatIST(rental.expectedReturnDate)}</p></div>
                                <div><h4 className="font-semibold">Plan</h4><p>{rental.plan.planName || "-"}</p></div>
                                <div><h4 className="font-semibold">Prior Balance</h4><p className="font-code">{formatINR(rental.balanceDue)}</p></div>
                                <div><h4 className="font-semibold">Status</h4><p><Badge variant={rental.status === "completed" ? "default" : rental.status === "ongoing" ? "secondary" : "destructive"}>{rental.status}</Badge></p></div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Vehicle Inspection</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="odometerEnd" render={({ field }) => (
                                        <FormItem><FormLabel>Odometer End (km)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="chargePercent" render={({ field }) => (
                                        <FormItem><FormLabel>Final Charge %</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="remarks" render={({ field }) => (
                                    <FormItem><FormLabel>Damage / Remarks</FormLabel><FormControl><Textarea {...field} placeholder="Add notes…" /></FormControl></FormItem>
                                )} />
                                <div>
                                    <p className="text-sm text-muted-foreground">Damage photos (optional)</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Button type="button" variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" /> Upload</Button>
                                        <p className="text-xs text-muted-foreground">You can wire this later to your uploader.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Accessories & Battery</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <FormField control={form.control} name="accessoriesReturned.helmet" render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 space-y-0">
                                            <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                                            <FormLabel>Helmet</FormLabel>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="accessoriesReturned.charger" render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 space-y-0">
                                            <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                                            <FormLabel>Charger</FormLabel>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="accessoriesReturned.phoneHolder" render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 space-y-0">
                                            <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                                            <FormLabel>Phone Holder</FormLabel>
                                        </FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="accessoriesReturned.others" render={({ field }) => (
                                    <FormItem><FormLabel>Other Returned Items</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="isBatteryMissing" render={({ field }) => (
                                    <FormItem className="flex items-center gap-2 space-y-0 pt-2">
                                        <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <FormLabel className="text-destructive">Battery missing</FormLabel>
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Charges & Adjustments</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {rental.status === "overdue" && (
                                    <div className="flex justify-between text-destructive">
                                        <span>Late Fee ({lateDays} days)</span>
                                        <span className="font-code">{formatINR(lateFee)}</span>
                                    </div>
                                )}
                                <FormField control={form.control} name="missingItemsCharge" render={({ field }) => (
                                    <FormItem className="flex items-center justify-between">
                                        <FormLabel>Missing Items</FormLabel><FormControl><Input type="number" className="w-28" {...field} /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="cleaningFee" render={({ field }) => (
                                    <FormItem className="flex items-center justify-between">
                                        <FormLabel>Cleaning Fee</FormLabel><FormControl><Input type="number" className="w-28" {...field} /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="damageFee" render={({ field }) => (
                                    <FormItem className="flex items-center justify-between">
                                        <FormLabel>Damage Fee</FormLabel><FormControl><Input type="number" className="w-28" {...field} /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="otherAdjustments" render={({ field }) => (
                                    <FormItem className="flex items-center justify-between">
                                        <FormLabel>Other Adjustments (+/-)</FormLabel><FormControl><Input type="number" className="w-28" {...field} /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="taxPercent" render={({ field }) => (
                                    <FormItem className="flex items-center justify-between">
                                        <FormLabel>Tax %</FormLabel><FormControl><Input type="number" className="w-20" {...field} /></FormControl>
                                    </FormItem>
                                )} />
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2 !p-4">
                                <Separator />
                                <Row label="Prior Balance" value={formatINR(rental.balanceDue)} />
                                <Row label="Additional Charges" value={formatINR(charges)} />
                                <Row label="Tax" value={formatINR(taxAmount)} />
                                <Separator />
                                <div className="flex justify-between w-full font-bold text-lg text-primary">
                                    <span>Final Amount Due</span><span>{formatINR(finalAmount)}</span>
                                </div>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <Button type="submit" disabled={!!inspection?.settled}><Save className="mr-2" />Save Draft</Button>
                                <Button type="button" onClick={handleSettle} disabled={!inspection || !!inspection?.settled || finalAmount > 0}>
                                    <CheckCircle className="mr-2" />Settle Return
                                </Button>
                                {finalAmount > 0 && (
                                    <p className="text-xs text-center text-destructive">Collect outstanding amount before settlement.</p>
                                )}

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" disabled={!inspection?.settled}><Printer className="mr-2" />Generate NOC</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>NOC Preview</DialogTitle></DialogHeader>
                                        <div className="text-sm">
                                            <p>Company: {settings.companyName}</p>
                                            <p>Rider: {rental.rider.fullName}</p>
                                            <p>Final Amount: {formatINR(finalAmount)}</p>
                                        </div>
                                        <div className="flex justify-center pt-4">
                                            <QRCode value={`noc:${inspection?.nocId || "N/A"}`} size={128} />
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                {inspection?.settled && (
                                    <div className="text-center text-green-600 font-semibold pt-2">Return Settled!</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </Form>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between w-full font-semibold">
            <span>{label}</span><span>{value}</span>
        </div>
    );
}
