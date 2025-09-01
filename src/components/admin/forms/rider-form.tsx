"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CreditCard, Fingerprint, ShipWheel } from "lucide-react";

export const RiderFormSchema = z.object({
    // contact
    fullName: z.string().min(3, "Full name must be at least 3 characters."),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile."),
    email: z.string().email("Enter a valid email."),

    // kyc
    aadhaar: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits"),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, "Invalid PAN format").transform(v => v.toUpperCase()),
    dl: z.string().optional(),
    aadhaarFile: z.any().optional(),
    panFile: z.any().optional(),
    dlFile: z.any().optional(),

    // plan & vehicle
    plan: z.enum(["Lite", "Pro"]),
    vehicleId: z.string().min(1, "Select a vehicle"),

    // schedule
    startDate: z.string().min(1, "Choose a start date"), // yyyy-mm-dd
    durationUnit: z.enum(["days", "weeks", "months"]),
    durationValue: z.coerce.number().int().min(1, "Min 1").max(24, "Max 24"),
}).refine(d => d.plan === "Lite" || !!d.dl, {
    message: "Driving License is required for Pro plan",
    path: ["dl"],
});

export type RiderFormValues = z.infer<typeof RiderFormSchema>;

type VehicleOpt = { id: string; label: string };

type RiderFormProps = {
    mode?: "create" | "edit";
    initialValues?: Partial<RiderFormValues>;
    vehicles?: VehicleOpt[];
    submitting?: boolean;
    onSubmitAction?: (values: RiderFormValues) => Promise<void> | void;
    onCancel?: () => void;
};

const FALLBACK_VEHICLES: VehicleOpt[] = [
    { id: "veh_001", label: "Ola S1 Pro • KA-01-1234" },
    { id: "veh_002", label: "Ather 450X • KA-05-5678" },
    { id: "veh_003", label: "TVS iQube • KA-03-9123" },
];

export function RiderForm({
                              mode = "create",
                              initialValues,
                              vehicles = FALLBACK_VEHICLES,
                              submitting,
                              onSubmitAction,
                              onCancel,
                          }: RiderFormProps) {
    const form = useForm<RiderFormValues>({
        resolver: zodResolver(RiderFormSchema),
        defaultValues: {
            // contact
            fullName: "",
            phone: "",
            email: "",
            // kyc
            aadhaar: "",
            pan: "",
            dl: "",
            aadhaarFile: undefined,
            panFile: undefined,
            dlFile: undefined,
            // plan & vehicle
            plan: "Lite",
            vehicleId: "",
            // schedule
            startDate: "",
            durationUnit: "months",
            durationValue: 1,
            ...initialValues,
        },
    });

    const plan = form.watch("plan");
    const startDate = form.watch("startDate");
    const durationUnit = form.watch("durationUnit");
    const durationValue = form.watch("durationValue");

    const endDateStr = useMemo(() => {
        if (!startDate || !durationValue) return "—";
        const d = new Date(startDate + "T00:00:00");
        if (Number.isNaN(d.getTime())) return "—";
        const out = new Date(d);
        if (durationUnit === "days") out.setDate(out.getDate() + durationValue);
        if (durationUnit === "weeks") out.setDate(out.getDate() + durationValue * 7);
        if (durationUnit === "months") out.setMonth(out.getMonth() + durationValue);
        return out.toISOString().slice(0, 10);
    }, [startDate, durationUnit, durationValue]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitAction!)} className="space-y-8">
                {/* CONTACT */}
                <Card>
                    <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl><Input placeholder="Rider full name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl><Input placeholder="10-digit mobile" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Email</FormLabel>
                                    <FormControl><Input type="email" placeholder="name@example.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* KYC */}
                <div className="space-y-3">
                    <h2 className="text-xl font-semibold">KYC Details</h2>
                    <p className="text-sm text-muted-foreground">Aadhaar & PAN required; DL is mandatory for Pro plan.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Fingerprint className="text-primary" /> Aadhaar</CardTitle></CardHeader>
                        <CardContent className="grid gap-4">
                            <FormField
                                control={form.control}
                                name="aadhaar"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Aadhaar Number</FormLabel>
                                        <FormControl><Input placeholder="12-digit number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="aadhaarFile"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Upload Aadhaar (image/pdf)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="file"
                                                accept="image/*,application/pdf"
                                                onChange={(e) => field.onChange(e.target.files?.[0])}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="text-primary" /> PAN</CardTitle></CardHeader>
                        <CardContent className="grid gap-4">
                            <FormField
                                control={form.control}
                                name="pan"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>PAN Number</FormLabel>
                                        <FormControl><Input placeholder="ABCDE1234F" className="uppercase" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="panFile"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Upload PAN (image/pdf)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="file"
                                                accept="image/*,application/pdf"
                                                onChange={(e) => field.onChange(e.target.files?.[0])}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* DL */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShipWheel className="text-primary" /> Driving License {form.watch("plan") === "Pro" && <span className="text-xs text-muted-foreground">(Required)</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="dl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>DL Number</FormLabel>
                                    <FormControl><Input placeholder="DL-XXXX-XXXXXXX" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dlFile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Upload DL (image/pdf)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => field.onChange(e.target.files?.[0])}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* PLAN + VEHICLE */}
                <Card>
                    <CardHeader><CardTitle>Plan & Vehicle</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="plan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Plan</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Basic">Basic</SelectItem>
                                            <SelectItem value="Pro">Pro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="vehicleId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assign Vehicle</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Choose a scooter" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* SCHEDULE */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="text-primary" /> Schedule</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="durationUnit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duration Unit</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="days">Days</SelectItem>
                                            <SelectItem value="weeks">Weeks</SelectItem>
                                            <SelectItem value="months">Months</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="durationValue"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duration</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={24}
                                            value={field.value}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            placeholder="e.g. 3"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="md:col-span-3">
                            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                                <span className="font-medium">Estimated End Date:</span> {endDateStr}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ACTIONS */}
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? (mode === "edit" ? "Saving…" : "Creating…") : (mode === "edit" ? "Save Changes" : "Create Rider")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
