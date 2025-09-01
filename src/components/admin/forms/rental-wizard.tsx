
'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { addDays, differenceInDays, isBefore } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RentalSchema } from '@/lib/schema';
import { useToast } from '@/hooks/use-toast';
import { mockRiders, mockVehicles, mockSettings } from '@/lib/mock-data';
import { formatINR, formatIST } from '@/lib/format';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import * as mockApi from '@/lib/mock-data';
import type { Vehicle } from '@/lib/types';


type RentalFormValues = z.infer<typeof RentalSchema>;

const STEPS = {
    RIDER: 1,
    VEHICLE: 2,
    PLAN: 3,
    CONFIRM: 4,
};

export function RentalWizard() {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(STEPS.RIDER);
    const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);

    const form = useForm<RentalFormValues>({
        resolver: zodResolver(RentalSchema),
        defaultValues: {
            riderId: '',
            vehicleId: '',
            plan: 'daily',
            startDate: new Date(),
            expectedReturnDate: addDays(new Date(), 1),
            payableTotal: mockSettings.dailyRateDefault,
        },
    });

    const formData = useWatch({ control: form.control });
    const selectedRider = mockRiders.find(r => r.id === formData.riderId);
    const selectedVehicle = mockVehicles.find(v => v.id === formData.vehicleId);

    // // Use useEffect to calculate total when dependencies change to avoid infinite loops
    // useEffect(() => {
    //     const { startDate, expectedReturnDate, plan } = formData;
    //     if (startDate && expectedReturnDate && isBefore(startDate, expectedReturnDate)) {
    //         const days = differenceInDays(expectedReturnDate, startDate) + 1;
    //         const calculatedTotal = plan === 'weekly'
    //             ? Math.ceil(days / 7) * mockSettings.weeklyRateDefault
    //             : days * mockSettings.dailyRateDefault;
    //
    //         form.setValue('payableTotal', calculatedTotal > 0 ? calculatedTotal : 0);
    //     } else {
    //         form.setValue('payableTotal', 0);
    //     }
    // }, [formData.startDate, formData.expectedReturnDate, formData.plan, form, form.setValue]);


    const fetchAvailableVehicles = async (start: Date, end: Date) => {
        // const vehicles = await mockApi.listAvailableVehicles({
        //     startDate: start.toISOString(),
        //     endDate: end.toISOString()
        // });
        setAvailableVehicles(mockVehicles);
    }

    async function onSubmit(data: RentalFormValues) {
        try {
            // Convert dates to ISO strings for the API
            const apiData = {
                ...data,
                startDate: data.startDate.toISOString(),
                expectedReturnDate: data.expectedReturnDate.toISOString(),
                paidTotal: 0, // Initial payment
            };
            // await mockApi.createRental(apiData as any); // Cast because API expects strings
            toast({
                title: 'Rental Created',
                description: `New rental for ${selectedRider?.fullName} has been created.`,
                variant: 'default',
            });
            router.push('/rentals');
        } catch(e: any) {
            toast({ title: 'Error creating rental', description: e.message, variant: 'destructive'});
        }
    }

    const nextStep = async () => {
        let isValid = false;
        if (step === STEPS.RIDER) {
            isValid = await form.trigger('riderId');
        } else if (step === STEPS.VEHICLE) {
            isValid = await form.trigger('vehicleId');
        } else if (step === STEPS.PLAN) {
            isValid = await form.trigger(['plan', 'payableTotal', 'startDate', 'expectedReturnDate']);
        }

        if (isValid) {
            if(step === STEPS.RIDER) {
                // We need to fetch vehicles before moving to the next step
                await fetchAvailableVehicles(form.getValues('startDate'), form.getValues('expectedReturnDate'));
            }
            setStep((prev) => Math.min(prev + 1, 4));
        }
    };
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    return (
        <Card>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>New Rental Wizard</CardTitle>
                        <CardDescription>Step {step} of {Object.keys(STEPS).length} - {Object.keys(STEPS)[step-1]}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-8 min-h-[200px]">
                        {step === STEPS.RIDER && (
                            <FormField
                                control={form.control}
                                name="riderId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select Rider</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Search and select a rider" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {mockRiders.map((rider) => (
                                                    <SelectItem key={rider.id} value={rider.id}>{rider.fullName} - {rider.phone}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {step === STEPS.VEHICLE && (
                            <FormField
                                control={form.control}
                                name="vehicleId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select Vehicle</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select an available vehicle" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableVehicles.length > 0 ? (
                                                    availableVehicles.map((vehicle) => (
                                                        <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.brand} {vehicle.name} - {vehicle.registrationNumber}</SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="text-center p-4 text-muted-foreground">No vehicles available for the selected dates.</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {step === STEPS.PLAN && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormField control={form.control} name="plan" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rental Plan</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                                />
                                <FormField control={form.control} name="payableTotal" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Payable (₹)</FormLabel>
                                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="startDate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date</FormLabel>
                                        <FormControl><Input type="date" value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''} onChange={e => field.onChange(new Date(e.target.value))} /></FormControl>
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="expectedReturnDate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Return Date</FormLabel>
                                        <FormControl><Input type="date" value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''} onChange={e => field.onChange(new Date(e.target.value))} /></FormControl>
                                    </FormItem>
                                )}/>
                            </div>
                        )}

                        {step === STEPS.CONFIRM && (
                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="font-semibold">Confirm Rental Details</h3>
                                <p><strong>Rider:</strong> {selectedRider?.fullName}</p>
                                <p><strong>Vehicle:</strong> {selectedVehicle?.brand} {selectedVehicle?.name} ({selectedVehicle?.registrationNumber})</p>
                                <p><strong>Plan:</strong> {formData.plan}</p>
                                <p><strong>Period:</strong> {formatIST(formData.startDate, 'dd MMM yyyy')} to {formatIST(formData.expectedReturnDate, 'dd MMM yyyy')}</p>
                                <p className="text-xl font-bold"><strong>Total:</strong> {formatINR(formData.payableTotal)}</p>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-between">
                        <Button type="button" variant="outline" onClick={prevStep} disabled={step === STEPS.RIDER}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                        </Button>
                        {step < STEPS.CONFIRM && (
                            <Button type="button" onClick={nextStep}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                        {step === STEPS.CONFIRM && <Button type="submit">Create Rental</Button>}
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
