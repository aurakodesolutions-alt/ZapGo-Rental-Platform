"use client"

import { useEffect } from 'react';
import { useBookingWizard } from './booking-provider';
import { DateRangePicker } from '../ui/date-range-picker';
import { Label } from '../ui/label';
import { addDays, isBefore, differenceInDays } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { IndianRupee, MapPin } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface Step1DatesProps {
    onNext: () => void;
}

export function Step1_Dates({ onNext }: Step1DatesProps) {
    const { draft, setDraft } = useBookingWizard();
    const city = 'Siliguri';

    // Set the city in the draft on component mount if it's not already set
    useEffect(() => {
        if (draft.city !== city) {
            setDraft({ city: city });
        }
    }, [draft.city, setDraft]);


    const handleDateChange = (range: DateRange | undefined) => {
        if (range?.from && range.to && differenceInDays(range.to, range.from) > 30) {
            // alert or toast maybe?
            return;
        }
        setDraft({ dates: range });
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">When are you riding?</h1>
                <p className="text-muted-foreground">Select your rental dates to get started.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <Label>Selected city</Label>
                    <div className="flex items-center h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        {city}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Select your rental period</Label>
                    <DateRangePicker
                        date={draft.dates}
                        onDateChange={handleDateChange}
                        disabledDates={(date) => isBefore(date, addDays(new Date(),-1))}
                    />
                    <p className="text-xs text-muted-foreground">Maximum rental period is 30 days.</p>
                </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
                <IndianRupee className="h-4 w-4 text-blue-600" />
                <AlertTitle>First-Time Rider Fees</AlertTitle>
                <AlertDescription>A one-time joining fee of ₹1000 and a fully refundable security deposit of ₹1750 will be collected during verification.</AlertDescription>
            </Alert>

        </div>
    );
}
