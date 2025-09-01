
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { differenceInDays, isBefore } from 'date-fns';
import { ArrowLeft, Printer, Save, CheckCircle, Ban, Upload } from 'lucide-react';
import QRCode from 'qrcode.react';

import * as mockApi from '@/lib/mock-data';
import { ReturnInspectionSchema } from '@/lib/schema';
import type { Rental, Settings, ReturnInspection } from '@/lib/types';
import { formatINR, formatIST } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {Badge} from "@/components/ui/badge";

type ReturnFormValues = z.infer<typeof ReturnInspectionSchema>;

export default function ReturnDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { toast } = useToast();
    const [rental, setRental] = useState<Rental | null>(null);
    const [inspection, setInspection] = useState<ReturnInspection | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<ReturnFormValues>({
        resolver: zodResolver(ReturnInspectionSchema),
    });

    const watchedValues = form.watch();

    // Load data
    // useEffect(() => {
    //     Promise.all([
    //         mockApi.getRental(params.id),
    //         mockApi.getReturnInspection(params.id), // This might be null if not created yet
    //         mockApi.getSettings()
    //     ]).then(([rentalData, inspectionData, settingsData]) => {
    //         if (!rentalData) notFound();
    //         setRental(rentalData);
    //         setInspection(inspectionData || null);
    //         setSettings(settingsData);
    //
    //         const lateDays = rentalData.status === 'overdue'
    //             ? differenceInDays(new Date(), new Date(rentalData.expectedReturnDate))
    //             : 0;
    //
    //         const initialValues: Partial<ReturnFormValues> = inspectionData ?
    //             { ...inspectionData } :
    //             {
    //                 odometerEnd: 0,
    //                 chargePercent: 100,
    //                 accessoriesReturned: { helmet: true, charger: true, phoneHolder: false },
    //                 isBatteryMissing: false,
    //                 missingItemsCharge: 0,
    //                 cleaningFee: 0,
    //                 damageFee: 0,
    //                 otherAdjustments: 0,
    //                 taxPercent: settingsData.taxPercentDefault || 18,
    //             };
    //
    //         form.reset(initialValues);
    //         setIsLoading(false);
    //     });
    // }, [params.id, form]);

    // Calculate settlement
    const lateFee = rental?.status === 'overdue' && settings?.lateFeeEnabled
        ? (differenceInDays(new Date(), new Date(rental.expectedReturnDate)) || 0) * (settings?.lateFeePerDay || 0)
        : 0;

    const charges = (watchedValues.missingItemsCharge || 0) +
        (watchedValues.cleaningFee || 0) +
        (watchedValues.damageFee || 0) +
        lateFee +
        (watchedValues.otherAdjustments || 0);

    const subtotal = charges;
    const taxAmount = subtotal * ((watchedValues.taxPercent || 0) / 100);
    const totalDue = subtotal + taxAmount + (rental?.balanceDue || 0);
    const finalAmount = totalDue;

    async function handleSave(data: ReturnFormValues) {
        if (!rental) return;

        const payload = {
            ...data,
            rentalId: rental.id,
            riderId: rental.riderId,
            vehicleId: rental.vehicleId,
            lateDays: rental.status === 'overdue' ? differenceInDays(new Date(), new Date(rental.expectedReturnDate)) : 0,
            lateFee,
            subtotal,
            taxAmount,
            totalDue,
            finalAmount,
        };

        try {
            let updatedInspection: ReturnInspection;
            // if(inspection) {
            //     updatedInspection = await mockApi.updateReturnInspection(inspection.id, payload);
            // } else {
            //     updatedInspection = await mockApi.createReturnInspection(payload as any);
            // }
            // setInspection(updatedInspection);
            toast({ title: 'Draft Saved', description: 'Return details have been saved.' });
        } catch(e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        }
    }

    async function handleSettle() {
        if (!inspection) {
            toast({ title: 'Save Draft First', description: 'You must save the inspection details before settling.', variant: 'destructive'});
            return;
        }

        try {
            // await mockApi.settleReturn(inspection.id);
            toast({ title: 'Return Settled', description: `Rental for ${rental?.rider?.fullName} has been completed.`, variant: 'default' });
            router.push('/returns');
            router.refresh(); // To update lists elsewhere
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        }
    }

    if (isLoading || !rental || !settings) {
        return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
    }

    return (
        <Form {...form}>
            <div className="space-y-6">
                <PageHeader title={`Process Return for #${rental.id.substring(0,7)}...`} description={`Rider: ${rental?.rider?.fullName} | Vehicle: ${rental?.vehicle?.code}`}>
                    <Button variant="outline" asChild>
                        <Link href="/admin/returns"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Returns</Link>
                    </Button>
                </PageHeader>

                <form onSubmit={form.handleSubmit(handleSave)} className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Rental Summary</CardTitle></CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div><h4 className="font-semibold">Period</h4><p>{formatIST(rental.startDate)} - {formatIST(rental.expectedReturnDate)}</p></div>
                                <div><h4 className="font-semibold">Plan</h4><p>{rental.plan}</p></div>
                                <div><h4 className="font-semibold">Prior Balance</h4><p className="font-code">{formatINR(rental.balanceDue)}</p></div>
                                <div><h4 className="font-semibold">Status</h4><p><Badge variant={rental.status === 'completed' ? 'default' : rental.status === 'ongoing' ? 'secondary' : 'destructive'}>{rental.status}</Badge></p></div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Vehicle Inspection</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="odometerEnd" render={({field}) => <FormItem><FormLabel>Odometer End (km)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>}/>
                                    <FormField control={form.control} name="chargePercent" render={({field}) => <FormItem><FormLabel>Final Charge %</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>}/>
                                </div>
                                <FormField control={form.control} name="damageNotes" render={({field}) => <FormItem><FormLabel>Damage Notes</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>}/>
                                <div>
                                    <Label>Damage Photos</Label>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Button type="button" variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" /> Upload</Button>
                                        <p className="text-xs text-muted-foreground">Mock upload</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Accessories & Battery</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <Label>Accessories Returned</Label>
                                <div className="flex items-center gap-4">
                                    <FormField control={form.control} name="accessoriesReturned.helmet" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Helmet</FormLabel></FormItem>)} />
                                    <FormField control={form.control} name="accessoriesReturned.charger" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Charger</FormLabel></FormItem>)} />
                                    <FormField control={form.control} name="accessoriesReturned.phoneHolder" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Phone Holder</FormLabel></FormItem>)} />
                                </div>
                                <FormField control={form.control} name="accessoriesReturned.others" render={({field}) => <FormItem><FormLabel>Other Returned Items</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>}/>
                                <FormField control={form.control} name="isBatteryMissing" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-destructive">Mark if battery is missing</FormLabel></FormItem>)} />

                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Final Remarks</CardTitle></CardHeader>
                            <CardContent>
                                <FormField control={form.control} name="remarks" render={({field}) => <FormItem><FormControl><Textarea {...field} placeholder="Add any final notes about the return process..."/></FormControl></FormItem>}/>
                            </CardContent>
                        </Card>

                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Charges & Adjustments</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {rental.status === 'overdue' && (
                                    <div className="flex justify-between text-destructive"><span>Late Fee ({differenceInDays(new Date(), new Date(rental.expectedReturnDate))} days)</span> <span className="font-code">{formatINR(lateFee)}</span></div>
                                )}
                                <FormField control={form.control} name="missingItemsCharge" render={({field}) => <FormItem className="flex items-center justify-between"><FormLabel>Missing Items</FormLabel><FormControl><Input type="number" className="w-24" {...field} /></FormControl></FormItem>} />
                                <FormField control={form.control} name="cleaningFee" render={({field}) => <FormItem className="flex items-center justify-between"><FormLabel>Cleaning Fee</FormLabel><FormControl><Input type="number" className="w-24" {...field} /></FormControl></FormItem>} />
                                <FormField control={form.control} name="damageFee" render={({field}) => <FormItem className="flex items-center justify-between"><FormLabel>Damage Fee</FormLabel><FormControl><Input type="number" className="w-24" {...field} /></FormControl></FormItem>} />
                                <FormField control={form.control} name="otherAdjustments" render={({field}) => <FormItem className="flex items-center justify-between"><FormLabel>Other Adjustments (+/-)</FormLabel><FormControl><Input type="number" className="w-24" {...field} /></FormControl></FormItem>} />
                                <FormField control={form.control} name="taxPercent" render={({field}) => <FormItem className="flex items-center justify-between"><FormLabel>Tax %</FormLabel><FormControl><Input type="number" className="w-24" {...field} /></FormControl></FormItem>} />
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2 !p-4">
                                <Separator />
                                <div className="flex justify-between w-full font-semibold"><span>Prior Balance</span><span>{formatINR(rental.balanceDue)}</span></div>
                                <div className="flex justify-between w-full font-semibold"><span>Additional Charges</span><span>{formatINR(charges)}</span></div>
                                <div className="flex justify-between w-full font-semibold"><span>Tax</span><span>{formatINR(taxAmount)}</span></div>
                                <Separator />
                                <div className="flex justify-between w-full font-bold text-lg text-primary"><span>Final Amount Due</span><span>{formatINR(finalAmount)}</span></div>
                            </CardFooter>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <Button type="submit" disabled={inspection?.settled}><Save className="mr-2"/>Save Draft</Button>
                                <Button type="button" onClick={handleSettle} disabled={!inspection || inspection.settled || finalAmount > 0}><CheckCircle className="mr-2"/>Settle Return</Button>
                                {finalAmount > 0 && <p className="text-xs text-center text-destructive">Settle any balance before closing the return.</p>}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" disabled={!inspection?.settled}><Printer className="mr-2"/>Generate NOC</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>NOC Preview</DialogTitle></DialogHeader>
                                        <div className="text-sm">
                                            <p>Company: {settings.companyName}</p>
                                            <p>Rider: {rental?.rider?.fullName}</p>
                                            <p>Final Amount: {formatINR(finalAmount)}</p>
                                        </div>
                                        <div className="flex justify-center pt-4">
                                            <QRCode value={`noc:${inspection?.nocId || 'N/A'}`} size={128} />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                {inspection?.settled && <div className="text-center text-green-600 font-semibold pt-2">Return Settled!</div>}
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </Form>
    );
}
