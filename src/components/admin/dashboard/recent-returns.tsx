
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as mockApi from '@/lib/mock-data';
import { formatIST } from '@/lib/format';
import type { Rental } from '@/lib/types';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';

export function RecentReturns() {
    const [recentReturns, setRecentReturns] = useState<Rental[]>(mockApi.mockRentals);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Returns</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {recentReturns.length > 0 ? recentReturns.map((rental) => (
                        <div key={rental.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback><RotateCcw className="h-4 w-4 text-muted-foreground"/></AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    <Link href={`/admin/vehicles/${rental?.vehicle?.id}`} className="hover:underline">{rental?.vehicle?.code}</Link>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Returned by <Link href={`/admin/riders/${rental.riderId}`} className="hover:underline">{rental?.rider?.fullName}</Link>
                                </p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="text-sm text-muted-foreground">{rental.actualReturnDate ? formatIST(rental.actualReturnDate, 'dd MMM') : 'N/A'}</p>
                                <Link href={`/admin/returns/${rental.id}`} className="text-sm text-primary hover:underline">
                                    View
                                </Link>
                            </div>
                        </div>
                    )) : <p className="text-sm text-muted-foreground text-center">No recent returns found.</p>}
                </div>
            </CardContent>
        </Card>
    );
}
