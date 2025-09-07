"use client";

import * as React from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { addDays, differenceInCalendarDays, isValid, parseISO } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useRiders } from "@/hooks/api/use-riders";
import { useVehicles } from "@/hooks/api/use-vehicles";
import { usePlans } from "@/hooks/api/use-plans";
import { formatINR } from "@/lib/format";
import {
    ArrowLeft,
    ArrowRight,
    WalletMinimal,
    CheckCircle2,
    Car,
    UserRound,
    CalendarDays,
    Wallet,
} from "lucide-react";
import type { Vehicle, Plan } from "@/lib/types";

const WizardSchema = z.object({
    riderId: z.coerce.number().int().positive({ message: "Select a rider" }),
    vehicleId: z.coerce.number().int().positive({ message: "Select a vehicle" }),
    // planId is auto-set from vehicle and locked
    planId: z.coerce.number().int().positive({ message: "Plan resolves from vehicle" }),
    startDate: z.string().min(10, "Pick start date"),
    expectedReturnDate: z.string().min(10, "Pick return date"),
    // optional initial collection
    payNowAmount: z.coerce.number().min(0).default(0),
    payNowMethod: z.string().trim().default("CASH"),
    payNowTxnRef: z.string().trim().optional(),
});

type FormValues = z.infer<typeof WizardSchema>;
const STEPS = ["Rider", "Vehicle", "Dates", "Payment", "Confirm"] as const;

export function RentalWizard() {
    const router = useRouter();
    const { toast } = useToast();

    // DB hooks
    const { riders = [], isLoading: ridersLoading } = useRiders();
    const { vehicles = [], isLoading: vehiclesLoading } = useVehicles();
    const { plans = [], isLoading: plansLoading } = usePlans();

    const form = useForm<FormValues>({
        resolver: zodResolver(WizardSchema),
        defaultValues: {
            riderId: undefined as any,
            vehicleId: undefined as any,
            planId: undefined as any,
            startDate: new Date().toISOString().slice(0, 10),
            expectedReturnDate: addDays(new Date(), 1).toISOString().slice(0, 10),
            payNowAmount: 0,
            payNowMethod: "CASH",
            payNowTxnRef: "",
        },
        mode: "onChange",
    });

    const [step, setStep] = React.useState(0);
    const fw = useWatch({ control: form.control });

    // Find selected vehicle & the plan it belongs to
    const selectedVehicle = React.useMemo<Vehicle | undefined>(
        () => (vehicles as Vehicle[]).find(v => Number(v.vehicleId) === Number(fw.vehicleId)),
        [vehicles, fw.vehicleId]
    );


    const resolvedPlan: Plan | undefined = React.useMemo(() => {
        if (!selectedVehicle) return undefined;
        const vehiclePlan = (selectedVehicle.plan ?? undefined) as Partial<Plan> | undefined;
        const fromPlans = (plans as Plan[]).find(
            (p) => Number(p.planId) === Number(selectedVehicle.planId)
        );
        return fromPlans ? { ...vehiclePlan, ...fromPlans } : (vehiclePlan as Plan | undefined);
    }, [selectedVehicle?.planId, selectedVehicle?.plan, plans]);

    // Auto-set & lock plan from selected vehicle
    React.useEffect(() => {
        if (selectedVehicle?.planId && fw.planId !== selectedVehicle.planId) {
            form.setValue("planId", selectedVehicle.planId, { shouldValidate: true, shouldDirty: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVehicle?.planId]);

    // Only available stock
    const onlyAvailableVehicles = React.useMemo(
        () =>
            (vehicles as Vehicle[]).filter(
                v => String(v.status).toLowerCase() === "available" && Number(v.quantity ?? 0) > 0
            ),
        [vehicles]
    );
    // Live pricing preview (authoritative calc still happens in API)
    const rentPerDay = Number(selectedVehicle?.rentPerDay ?? 0);
    const joining = Number(resolvedPlan?.joiningFees ?? (resolvedPlan as any)?.joiningFees ?? 0);
    const deposit = Number(resolvedPlan?.securityDeposit ?? 0);

    const days = React.useMemo(() => {
        const s = parseISO(fw.startDate ?? "");
        const e = parseISO(fw.expectedReturnDate ?? "");
        if (!isValid(s) || !isValid(e)) return 0;
        return Math.max(1, differenceInCalendarDays(e, s) + 1);
    }, [fw.startDate, fw.expectedReturnDate]);

    const usage = days * rentPerDay;
    const total = joining + deposit + usage;

    const next = async () => {
        const stepFields: (keyof FormValues)[][] = [
            ["riderId"],
            ["vehicleId"], // planId is auto-set
            ["startDate", "expectedReturnDate"], // plan is locked from vehicle
            [], // payment optional
        ];
        const fields = stepFields[step] ?? [];
        const ok = fields.length ? await form.trigger(fields) : true;
        if (!ok) return;
        setStep(s => Math.min(s + 1, STEPS.length - 1));
    };

    const prev = () => setStep(s => Math.max(s - 1, 0));

    async function onSubmit(values: FormValues) {
        try {
            const body = {
                riderId: Number(values.riderId),
                vehicleId: Number(values.vehicleId),
                planId: Number(values.planId), // from vehicle
                startDate: new Date(values.startDate).toISOString(),
                expectedReturnDate: new Date(values.expectedReturnDate).toISOString(),
                payment:
                    Number(values.payNowAmount) > 0
                        ? {
                            amount: Number(values.payNowAmount),
                            method: values.payNowMethod,
                            status: "SUCCESS",
                            txnRef: values.payNowTxnRef || null,
                        }
                        : undefined,
            };

            const r = await fetch("/api/v1/admin/rentals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const j = await r.json();
            if (!r.ok || !j?.ok) throw new Error(j?.error || "Create failed");

            toast({
                title: "Rental created",
                description: `Rental #${j.data?.rentalId} created successfully.`,
            });

            router.push(`/admin/rentals/${j.data?.rentalId}`);
        } catch (e: any) {
            toast({ title: "Error", description: String(e?.message || e), variant: "destructive" });
        }
    }

    // Optional Cashfree order for the current preview amount
    async function handleCashfree() {
        try {
            if (!fw.riderId || !selectedVehicle || !resolvedPlan) return;
            const rider = (riders as any[]).find(r => r.riderId === Number(fw.riderId));
            if (!rider) throw new Error("Rider not found");
            const amount = total;

            const orderId = `NEW-${Date.now()}`;
            const r = await fetch("/api/v1/admin/payments/cashfree/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId,
                    amount,
                    customer: {
                        id: rider.riderId,
                        name: rider.fullName,
                        email: rider.email,
                        phone: rider.phone,
                    },
                }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Cashfree order failed");

            form.setValue("payNowMethod", "CASHFREE");
            form.setValue("payNowAmount", amount);
            form.setValue("payNowTxnRef", j?.raw?.order_id || j?.raw?.cf_order_id || orderId);

            toast({
                title: "Cashfree order created",
                description: "Complete the payment in Cashfree checkout, then continue.",
            });
        } catch (e: any) {
            toast({ title: "Cashfree error", description: String(e?.message || e), variant: "destructive" });
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Main wizard */}
            <Card className="lg:col-span-2">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader className="space-y-2">
                            <CardTitle>New Rental</CardTitle>
                            <CardDescription>Fill in the details below to create a rental.</CardDescription>

                            {/* Stepper */}
                            <div className="mt-2 grid grid-cols-5 gap-2">
                                {STEPS.map((label, i) => (
                                    <div key={label} className="flex items-center gap-2">
                                        <div
                                            className={[
                                                "h-7 w-7 shrink-0 rounded-full text-xs grid place-items-center",
                                                i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary/80 text-white" : "bg-muted text-muted-foreground",
                                            ].join(" ")}
                                        >
                                            {i + 1}
                                        </div>
                                        <div className={`text-xs ${i <= step ? "font-medium" : "text-muted-foreground"}`}>{label}</div>
                                    </div>
                                ))}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-8">
                            {/* Step 1: Rider */}
                            {step === 0 && (
                                <div>
                                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                                        <UserRound className="h-4 w-4" />
                                        Choose an existing rider from your database
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="riderId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rider</FormLabel>
                                                <Select
                                                    onValueChange={(v) => field.onChange(Number(v))}
                                                    defaultValue={field.value ? String(field.value) : undefined}
                                                    disabled={ridersLoading}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={ridersLoading ? "Loading…" : "Select rider"} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {(riders as any[]).map((r) => (
                                                            <SelectItem key={r.riderId} value={String(r.riderId)}>
                                                                {r.fullName} — {r.phone}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {/* Step 2: Vehicle (plan auto-resolves here) */}
                            {step === 1 && (
                                <div>
                                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                                        <Car className="h-4 w-4" />
                                        Select an available vehicle (its plan will be auto-selected)
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="vehicleId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vehicle</FormLabel>
                                                <Select
                                                    onValueChange={(v) => field.onChange(Number(v))}
                                                    defaultValue={field.value ? String(field.value) : undefined}
                                                    disabled={vehiclesLoading}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={vehiclesLoading ? "Loading…" : "Select available vehicle"} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {onlyAvailableVehicles.map((v) => (
                                                            <SelectItem key={v.vehicleId} value={String(v.vehicleId)}>
                                                                {v.model} ({v.uniqueCode}) — ₹{Number(v.rentPerDay ?? 0)} /day
                                                                {v.plan?.planName ? ` · ${v.plan.planName}` : ""}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Plan preview (locked) */}
                                    <div className="mt-4 rounded-lg border p-4 text-sm">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Badge variant="secondary">Plan</Badge>
                                            <div className="font-medium">
                                                {resolvedPlan ? resolvedPlan.planName : "—"}
                                            </div>
                                            <span className="text-muted-foreground">· Joining</span>
                                            <span className="font-medium">₹{Number(joining || 0)}</span>
                                            <span className="text-muted-foreground">· Deposit</span>
                                            <span className="font-medium">₹{Number(deposit || 0)}</span>
                                            <span className="ml-auto text-xs text-muted-foreground">Auto-selected from vehicle</span>
                                        </div>
                                        {/* Hidden, but kept in the form for validation & submission */}
                                        <input type="hidden" value={fw.planId ?? ""} readOnly />
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Dates */}
                            {step === 2 && (
                                <div>
                                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                                        <CalendarDays className="h-4 w-4" />
                                        Choose rental period
                                    </div>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="startDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Start date</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            value={field.value ?? ""}
                                                            onChange={(e) => field.onChange(e.target.value)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="expectedReturnDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Return date</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            value={field.value ?? ""}
                                                            onChange={(e) => field.onChange(e.target.value)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm md:grid-cols-5">
                                        <KV label="Days" value={String(days || "—")} />
                                        <KV label="Rent / day" value={`₹${rentPerDay || 0}`} />
                                        <KV label="Usage" value={`₹${usage || 0}`} />
                                        <KV label="Joining" value={`₹${joining || 0}`} />
                                        <KV label="Deposit" value={`₹${deposit || 0}`} />
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Payment (optional) */}
                            {step === 3 && (
                                <div>
                                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                                        <Wallet className="h-4 w-4" />
                                        Optionally collect an upfront amount now
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="payNowAmount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Collect now (₹)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            step="0.01"
                                                            value={field.value ?? 0}
                                                            onChange={(e) => field.onChange(Number(e.target.value || 0))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="payNowMethod"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Method</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="CASH">Cash</SelectItem>
                                                            <SelectItem value="UPI">UPI</SelectItem>
                                                            <SelectItem value="CARD">Card</SelectItem>
                                                            <SelectItem value="CASHFREE">Cashfree</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="payNowTxnRef"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>Transaction Ref / Notes</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., UTR/Txn ID or notes" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        <Button type="button" variant="secondary" onClick={handleCashfree}>
                                            <WalletMinimal className="mr-2 h-4 w-4" />
                                            Collect full amount via Cashfree
                                        </Button>
                                        <p className="text-xs text-muted-foreground">
                                            Creates a Cashfree order and fills the reference. After checkout, proceed to Confirm.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Confirm */}
                            {step === 4 && (
                                <div className="space-y-4 rounded-lg border p-4 text-sm">
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <b>Review</b>
                                    </div>
                                    <div>Rider ID: {fw.riderId}</div>
                                    <div>Vehicle ID: {fw.vehicleId}</div>
                                    <div>
                                        Plan ID: {fw.planId} · Period: {fw.startDate} → {fw.expectedReturnDate} ({days} days)
                                    </div>
                                    <div>Total: {formatINR(total)}</div>
                                    {Number(fw.payNowAmount) > 0 && (
                                        <div>
                                            Initial payment: {formatINR(Number(fw.payNowAmount))} via {fw.payNowMethod}
                                            {fw.payNowTxnRef ? ` (ref: ${fw.payNowTxnRef})` : ""}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex justify-between">
                            <Button type="button" variant="outline" onClick={prev} disabled={step === 0}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Previous
                            </Button>
                            {step < STEPS.length - 1 ? (
                                <Button type="button" onClick={next}>
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button type="submit">Create Rental</Button>
                            )}
                        </CardFooter>
                    </form>
                </Form>
            </Card>

            {/* Sticky live summary */}
            <div className="lg:col-span-1">
                <Card className="lg:sticky lg:top-20">
                    <CardHeader>
                        <CardTitle>Quote Summary</CardTitle>
                        <CardDescription>Auto-updates as you fill the wizard.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <SummaryRow label="Rider" value={fw.riderId ? `#${fw.riderId}` : "—"} />
                        <SummaryRow label="Vehicle" value={selectedVehicle ? `${selectedVehicle.model} (${selectedVehicle.uniqueCode})` : "—"} />
                        <SummaryRow label="Plan" value={resolvedPlan?.planName ?? "—"} />
                        <Separator />
                        <SummaryRow label="Days" value={days ? String(days) : "—"} />
                        <SummaryRow label="Rent / day" value={`₹${rentPerDay || 0}`} />
                        <SummaryRow label="Usage" value={`₹${usage || 0}`} />
                        <SummaryRow label="Joining" value={`₹${joining || 0}`} />
                        <SummaryRow label="Deposit" value={`₹${deposit || 0}`} />
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Total</div>
                            <div className="text-lg font-semibold">{formatINR(total || 0)}</div>
                        </div>
                        {Number(fw.payNowAmount) > 0 && (
                            <div className="flex items-center justify-between">
                                <div className="text-muted-foreground">Collect now</div>
                                <div className="font-medium">{formatINR(Number(fw.payNowAmount))} <span className="text-xs text-muted-foreground">({fw.payNowMethod})</span></div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

/* ---------- tiny presentational helpers ---------- */
function KV({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    );
}
function SummaryRow({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="flex items-center justify-between">
            <div className="text-muted-foreground">{label}</div>
            <div className="font-medium">{value ?? "—"}</div>
        </div>
    );
}
