'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { useState } from 'react';

const trackBookingSchema = z.object({
    phone: z.string().min(10, 'Please enter a valid phone number.'),
    code: z.string().min(6, 'Please enter your 6-character booking code.'),
});

type TrackBookingFormValues = z.infer<typeof trackBookingSchema>;

export default function TrackBookingPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<TrackBookingFormValues>({
        resolver: zodResolver(trackBookingSchema),
        defaultValues: {
            phone: '',
            code: '',
        },
    });

    async function onSubmit(data: TrackBookingFormValues) {
        setIsLoading(true);
        // This is a mock implementation.
        // In a real app, you would make an API call to find the booking ID
        // associated with the phone number and public code.
        // e.g. const res = await fetch(`/api/track?phone=${data.phone}&code=${data.code}`)
        // const { bookingId } = await res.json();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For demo, we'll assume a booking ID and navigate.
        const mockBookingId = 'BK12345';

        toast({
            title: 'Booking Found!',
            description: 'Redirecting to your booking status...',
        });

        router.push(`/booking/${mockBookingId}?code=${data.code}`);
        setIsLoading(false);
    }

    return (
        <div className="container mx-auto py-12 px-4">
            <Card className="max-w-md mx-auto rounded-2xl shadow-md">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-3xl">Track Your Booking</CardTitle>
                    <CardDescription>Enter your phone number and booking code to view your ride status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your 10-digit phone number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Booking Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. XYZ789" {...field} className="font-code" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading} className="w-full rounded-xl">
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="mr-2 h-4 w-4" />
                                )}
                                Find My Booking
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
