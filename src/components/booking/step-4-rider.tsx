
"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useBookingWizard } from "./booking-provider";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
// import { AuthDialog } from "../auth/auth-dialog";
import { Loader2, Fingerprint, CreditCard, Car } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { FileUpload } from "./file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const riderSchema = z.object({
    fullName: z.string().min(3, "Full name must be at least 3 characters."),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number."),
    email: z.string().email(),
    aadhaar: z.string().regex(/^\d{12}$/, "Must be 12 digits"),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format").transform(val => val.toUpperCase()),
    dl: z.string().optional(),
    aadhaarFile: z.any().optional(),
    panFile: z.any().optional(),
    dlFile: z.any().optional(),
    termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms."),
});

type RiderFormData = z.infer<typeof riderSchema>;

interface Step4RiderProps {
    onNext: () => void;
}

export function Step4_Rider({ onNext }: Step4RiderProps) {
    const { draft, setDraft } = useBookingWizard();
    // const { data: session, status } = useSession();
    const [authDialogOpen, setAuthDialogOpen] = useState(false);

    const form = useForm<RiderFormData>({
        resolver: zodResolver(riderSchema),
        defaultValues: {
            fullName:  "",
            email:  "",
            phone: "",
            aadhaar: "",
            pan:  "",
            dl: "",
            termsAccepted:  false,
        },
    });

    // useEffect(() => {
    //     if (session) {
    //         form.setValue('fullName', session.user?.name || '');
    //         form.setValue('email', session.user?.email || '');
    //     }
    // }, [session, form]);


    const onSubmit = async (data: RiderFormData) => {
        if (status !== 'authenticated') {
            setAuthDialogOpen(true);
            return;
        }

        // KYC Pre-check
        const payload = {
            plan: draft.plan,
            aadhaar: data.aadhaar,
            pan: data.pan,
            dl: data.dl,
        };
        const kycRes = await fetch('/api/kyc/validate', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
        const kycResult = await kycRes.json();

        if (kycResult.status !== 'approved') {
            toast({ title: "KYC Check Failed", description: kycResult.message, variant: "destructive" });
            return;
        }

        setDraft({
            contact: { fullName: data.fullName, phone: data.phone, email: data.email },
            kyc: { aadhaar: data.aadhaar, pan: data.pan, dl: data.dl },
            termsAccepted: data.termsAccepted,
        });

        onNext();
    };

    if (status === 'loading') {
        return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold">Rider Details</h1>
                    <p className="text-muted-foreground">Just a few more details to complete your booking.</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="fullName" render={({ field }) => (
                                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="phone" render={({ field }) => (
                                        <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </CardContent>
                        </Card>

                        <div>
                            <h2 className="text-xl font-semibold">KYC Information</h2>
                            <p className="text-sm text-muted-foreground">We need these document numbers and files for verification.</p>
                        </div>

                        <div className="space-y-4">
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><Fingerprint className="text-primary"/> Aadhaar Details</CardTitle></CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="aadhaar" render={({ field }) => (
                                        <FormItem><FormLabel>Aadhaar Number</FormLabel><FormControl><Input {...field} placeholder="12-digit number" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="aadhaarFile" render={({ field }) => (
                                        <FormItem><FormLabel>Aadhaar Card Upload</FormLabel><FormControl><FileUpload file={field.value} onFileChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="text-primary"/> PAN Card Details</CardTitle></CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="pan" render={({ field }) => (
                                        <FormItem><FormLabel>PAN Number</FormLabel><FormControl><Input {...field} placeholder="Permanent Account Number" className="uppercase" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="panFile" render={({ field }) => (
                                        <FormItem><FormLabel>PAN Card Upload</FormLabel><FormControl><FileUpload file={field.value} onFileChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </CardContent>
                            </Card>

                            {draft.plan === 'Pro' && (
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><Car className="text-primary"/> Driving License Details</CardTitle></CardHeader>
                                    <CardContent className="grid md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="dl" render={({ field }) => (
                                            <FormItem><FormLabel>Driving License Number</FormLabel><FormControl><Input {...field} placeholder="Required for Pro plan" /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="dlFile" render={({ field }) => (
                                            <FormItem><FormLabel>Driving License Upload</FormLabel><FormControl><FileUpload file={field.value} onFileChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <FormField control={form.control} name="termsAccepted" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>I accept the <a href="#" className="underline text-primary">Privacy Policy & Terms of Service</a>.</FormLabel></div></FormItem>
                        )}/>
                    </form>
                </Form>
            </div>
            {/*<AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />*/}
        </>
    );
}
