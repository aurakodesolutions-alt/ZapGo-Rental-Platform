
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as mockApi from '@/lib/mock-data';
import { formatINR, formatIST } from '@/lib/format';
import type { Payment } from '@/lib/types';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export function RecentActivity() {
    const [recentPayments, setRecentPayments] = useState<Payment[]>(mockApi.mockPayments);



    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {recentPayments.length > 0 ? recentPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={`https://i.pravatar.cc/40?u=${payment?.rider?.id}`} alt="Avatar" />
                                <AvatarFallback>{payment?.rider?.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    <Link href={`/riders/${payment.riderId}`} className="hover:underline">{payment?.rider?.fullName}</Link>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Paid for Rental <Link href={`/rentals/${payment.rentalId}`} className="hover:underline">#{payment.rentalId.substring(0,4)}...</Link> via {payment.method}
                                </p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="font-medium font-code">{formatINR(payment.amount)}</p>
                                <p className='text-sm text-muted-foreground'>{formatIST(payment.transactionDate, 'dd MMM')}</p>
                            </div>
                        </div>
                    )) : <p className="text-sm text-muted-foreground text-center">No recent payments found.</p>}
                </div>
            </CardContent>
        </Card>
    );
}
