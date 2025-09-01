"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Fingerprint, ShipWheel } from "lucide-react";

/* ------------------------------- Schema ------------------------------- */
export const RiderFormSchema = z.object({
    // contact
    fullName: z.string().min(3, "Full name must be at least 3 characters."),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile."),
    email: z.string().email("Enter a valid email."),

    // kyc
    aadhaar: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits"),
    pan: z
        .string()
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, "Invalid PAN format")
        .transform((v) => v.toUpperCase()),
    dl: z.string().optional(),

    // file inputs (handled by your upload route later)
    aadhaarFile: z.any().optional(),
    panFile: z.any().optional(),
    dlFile: z.any().optional(),
});

export type RiderFormValues = z.infer<typeof RiderFormSchema>;

type RiderFormProps = {
    mode?: "create" | "edit";
    initialValues?: Partial<RiderFormValues>;
    submitting?: boolean;
    onSubmitAction?: (values: RiderFormValues) => Promise<void> | void;
    onCancel?: () => void;
};

export function RiderForm({
                              mode = "create",
                              initialValues,
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
            // files
            aadhaarFile: undefined,
            panFile: undefined,
            dlFile: undefined,
            ...initialValues,
        },
    });

    const handleSubmit = onSubmitAction ?? (() => {});

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                {/* CONTACT */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Rider full name" {...field} />
                                    </FormControl>
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
                                    <FormControl>
                                        <Input placeholder="10-digit mobile" {...field} />
                                    </FormControl>
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
                                    <FormControl>
                                        <Input type="email" placeholder="name@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* KYC */}
                <div className="space-y-3">
                    <h2 className="text-xl font-semibold">KYC Details</h2>
                    <p className="text-sm text-muted-foreground">
                        Aadhaar & PAN required; Driving License is optional (you can capture it later).
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Aadhaar */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Fingerprint className="text-primary" /> Aadhaar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <FormField
                                control={form.control}
                                name="aadhaar"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Aadhaar Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="12-digit number" {...field} />
                                        </FormControl>
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

                    {/* PAN */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="text-primary" /> PAN
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <FormField
                                control={form.control}
                                name="pan"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>PAN Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ABCDE1234F" className="uppercase" {...field} />
                                        </FormControl>
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

                {/* DL (optional) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShipWheel className="text-primary" /> Driving License (Optional)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="dl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>DL Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="DL-XXXX-XXXXXXX" {...field} />
                                    </FormControl>
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
