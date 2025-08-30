'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ArrowRight, Bike } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AvailabilityPage() {
    const [range, setRange] = useState<DateRange | undefined>();
    const [availableScooters, setAvailableScooters] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleCheckAvailability = async () => {
        if (!range || !range.from || !range.to) {
            toast({
                title: 'Invalid Date Range',
                description: 'Please select a start and end date.',
                variant: 'destructive',
            });
            return;
        }
        setIsLoading(true);
        setAvailableScooters(null);
        // Mock API call
        // In a real app, you would fetch from:
        // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vehicles/available?startDate=${format(range.from, 'yyyy-MM-dd')}&endDate=${format(range.to, 'yyyy-MM-dd')}`);
        // const data = await response.json();
        // setAvailableScooters(data.count);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAvailableScooters(Math.floor(Math.random() * 25));
        setIsLoading(false);
    };

    let footerText = 'Please pick a date range to check for available scooters.';
    if (range?.from) {
        if (!range.to) {
            footerText = format(range.from, 'PPP');
        } else if (range.to) {
            footerText = `${format(range.from, 'PPP')} – ${format(range.to, 'PPP')}`;
        }
    }

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <Card className="rounded-2xl shadow-md">
                    <CardHeader className="text-center">
                        <CardTitle className="font-headline text-3xl">Check Scooter Availability</CardTitle>
                        <CardDescription>Select a date range to see how many scooters are available for your trip.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-8">
                        <Calendar
                            mode="range"
                            selected={range}
                            onSelect={setRange}
                            numberOfMonths={2}
                            className="p-3 rounded-md border"
                        />
                        <div className="text-center text-muted-foreground">{footerText}</div>
                        <Button onClick={handleCheckAvailability} disabled={isLoading || !range?.to} size="lg" className="rounded-xl">
                            {isLoading ? 'Checking...' : 'Check Availability'}
                        </Button>

                        {availableScooters !== null && (
                            <Card className="mt-8 w-full max-w-md bg-primary/10 rounded-2xl">
                                <CardContent className="pt-6 text-center">
                                    <p className="text-lg">For the selected dates:</p>
                                    <div className="flex items-center justify-center gap-4 my-4">
                                        <Bike className="h-10 w-10 text-primary" />
                                        <p className="text-5xl font-bold text-primary">{availableScooters}</p>
                                    </div>
                                    <p className="text-lg">scooters are available!</p>
                                    <Button asChild className="mt-6 rounded-xl">
                                        <Link href="/book">
                                            Book Now <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
