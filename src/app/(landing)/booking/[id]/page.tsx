
'use client';

import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import QRCode from 'qrcode.react';
import { Calendar, User, Bike, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Booking } from '@/lib/types';

function BookingStatusComponent({ id }: { id: string }) {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const [booking, setBooking] = useState<Booking | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id || !code) {
            setError('Booking ID or code is missing.');
            setIsLoading(false);
            return;
        }

        const fetchBooking = async () => {
            setIsLoading(true);
            // In a real app, fetch from:
            // const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings/${id}/public?code=${code}`);
            // if (!res.ok) {
            //   setError('Failed to fetch booking details. Please check your link.');
            //   setIsLoading(false);
            //   return;
            // }
            // const data: Booking = await res.json();

            // Mock data for demonstration
            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockBooking: Booking = {
                id: id,
                publicCode: code,
                startDate: new Date().toISOString(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
                status: 'confirmed',
                vehicle: {
                    id: '2',
                    name: 'ZapGo Pro',
                    model: 'Power & Comfort',
                    range: 60,
                    imageUrl: 'https://placehold.co/400x300.png',
                },
                userName: 'Priya Sharma',
            };
            setBooking(mockBooking);
            setError(null);
            setIsLoading(false);
        };

        fetchBooking();
    }, [id, code]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return <p className="text-center text-destructive">{error}</p>;
    }

    if (!booking) {
        return <p className="text-center">No booking found.</p>;
    }

    return (
        <Card className="w-full max-w-2xl mx-auto rounded-2xl shadow-md">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-3xl">Booking Confirmed!</CardTitle>
                        <CardDescription>Your ride is ready. Here are the details.</CardDescription>
                    </div>
                    <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">
                        {booking.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span>{booking.userName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span>{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Bike className="h-5 w-5 text-muted-foreground" />
                        <span>{booking.vehicle.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="font-code text-primary bg-primary/10 px-2 py-1 rounded-md">
                            Booking ID: {booking.id}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-lg">
                    <p className="mb-2 font-semibold">Scan to unlock your scooter</p>
                    <div className="p-2 bg-white rounded-md shadow-sm">
                        <QRCode value={JSON.stringify({ bookingId: booking.id, code: booking.publicCode })} size={180} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function BookingStatusPage({ params }: { params: { id: string } }) {
    const { id } = use(Promise.resolve(params));
    return (
        <div className="container mx-auto py-12 px-4">
            <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
                <BookingStatusComponent id={id} />
            </Suspense>
        </div>
    );
}
