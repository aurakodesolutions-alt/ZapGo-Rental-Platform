"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBookingWizard } from "./booking-provider";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Fingerprint, CreditCard, Car } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { FileUpload } from "./file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const riderSchema = z.object({
    fullName: z.string().min(3, "Full name must be at least 3 characters."),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number."),
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters."),

    aadhaar: z.string().regex(/^\d{12}$/, "Must be 12 digits"),
    pan: z
        .string()
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format")
        .transform((val) => val.toUpperCase()),
    dl: z.string().optional(),

    aadhaarFile: z.any().optional(),
    panFile: z.any().optional(),
    dlFile: z.any().optional(),
    dlExpiry: z.string().optional(),

    termsAccepted: z.boolean().refine((val) => val, "You must accept the terms."),
});

type RiderFormData = z.infer<typeof riderSchema>;

interface Step4RiderProps {
    onNext: () => void;
}

export function Step4_Rider({ onNext }: Step4RiderProps) {
    const { draft, setDraft } = useBookingWizard();
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<RiderFormData>({
        resolver: zodResolver(riderSchema),
        defaultValues: {
            fullName: draft.contact?.fullName || "",
            email: draft.contact?.email || "",
            phone: draft.contact?.phone || "",
            password: draft.accountPassword || "",

            aadhaar: draft.kyc?.aadhaar || "",
            pan: draft.kyc?.pan || "",
            dl: draft.kyc?.dl || "",
            dlExpiry: "",

            termsAccepted: !!draft.termsAccepted,
        },
    });

    // If the user navigates back to this step, keep fields in sync with the draft
    useEffect(() => {
        if (draft.contact) {
            form.setValue("fullName", draft.contact.fullName ?? "");
            form.setValue("phone", draft.contact.phone ?? "");
            form.setValue("email", draft.contact.email ?? "");
        }
        if (draft.kyc) {
            form.setValue("aadhaar", draft.kyc.aadhaar ?? "");
            form.setValue("pan", draft.kyc.pan ?? "");
            form.setValue("dl", draft.kyc.dl ?? "");
        }
        if (draft.accountPassword) {
            form.setValue("password", draft.accountPassword);
        }
        form.setValue("termsAccepted", !!draft.termsAccepted);
    }, [draft, form]);

    // Derive plan code ("Lite" | "Pro") from draft
    const planCode: "Lite" | "Pro" = (() => {
        const code = (draft as any).planCode as string | undefined;
        const name = (draft as any).planName as string | undefined;
        const fallback = (draft as any).plan as string | undefined; // legacy string "Lite"/"Pro"
        const label = (code || name || fallback || "").toLowerCase();
        return label.includes("pro") ? "Pro" : "Lite";
    })();

    const onSubmit = async (data: RiderFormData) => {
        setSubmitting(true);
        try {
            // KYC pre-check
            const payload = {
                plan: planCode, // "Lite" or "Pro"
                aadhaar: data.aadhaar,
                pan: data.pan,
                dl: data.dl,
            };
            const kycRes = await fetch("/api/kyc/validate", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
            });
            const kycResult = await kycRes.json();

            if (!kycRes.ok || kycResult.status !== "approved") {
                toast({
                    title: "KYC Check Failed",
                    description: kycResult.message || "Please check your details and try again.",
                    variant: "destructive",
                });
                return;
            }

            // Persist to the wizard draft (including the NEW password field)
            setDraft({
                contact: {
                    fullName: data.fullName,
                    phone: data.phone,
                    email: data.email,
                },
                kyc: {
                    aadhaar: data.aadhaar,
                    pan: data.pan,
                    dl: data.dl,
                    // If you want to keep file handles/paths, add them here too.
                },
                termsAccepted: data.termsAccepted,
                accountPassword: data.password, // <-- IMPORTANT
            });

            onNext();
        } catch (e: any) {
            toast({
                title: "Something went wrong",
                description: e?.message || "Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const isPro = planCode === "Pro";

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Rider Details</h1>
                <p className="text-muted-foreground">Just a few more details to complete your booking.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
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
                                                <Input inputMode="numeric" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* NEW: Password field */}
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Create Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="At least 6 characters" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div>
                        <h2 className="text-xl font-semibold">KYC Information</h2>
                        <p className="text-sm text-muted-foreground">
                            We need these document numbers and files for verification.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Fingerprint className="text-primary" /> Aadhaar Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="aadhaar"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Aadhaar Number</FormLabel>
                                            <FormControl>
                                                <Input inputMode="numeric" placeholder="12-digit number" {...field} />
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
                                            <FormLabel>Aadhaar Card Upload</FormLabel>
                                            <FormControl>
                                                <FileUpload file={field.value} onFileChange={field.onChange} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="text-primary" /> PAN Card Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="pan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>PAN Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Permanent Account Number" className="uppercase" {...field} />
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
                                            <FormLabel>PAN Card Upload</FormLabel>
                                            <FormControl>
                                                <FileUpload file={field.value} onFileChange={field.onChange} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {isPro && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Car className="text-primary" /> Driving License Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="dl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Driving License Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Required for Pro plan" {...field} />
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
                                                <FormLabel>Driving License Upload</FormLabel>
                                                <FormControl>
                                                    <FileUpload file={field.value} onFileChange={field.onChange} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="dlExpiry"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Driving License Expiry</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="YYYY-MM-DD" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <FormField
                        control={form.control}
                        name="termsAccepted"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-4">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        I accept the{" "}
                                        <a href="#" className="underline text-primary">
                                            Privacy Policy & Terms of Service
                                        </a>.
                                    </FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end">
                        <Button type="submit" disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Continue
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
