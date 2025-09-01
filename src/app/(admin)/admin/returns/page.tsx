
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/admin/page-header';
import { formatINR, formatIST } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { FileDown, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as mockApi from '@/lib/mock-data';
import type { Rental } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isToday, isAfter, subDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReturnsPage() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = React.useState('');

    useEffect(() => {
        setLoading(true);
                        const openRentals = mockApi.mockRentals.filter(r => r.status === 'ongoing' || r.status === 'overdue')
                        const recentReturns = mockApi.mockRentals.filter(r => r.actualReturnDate && isAfter(new Date(r.actualReturnDate), subDays(new Date(), 7)));
                        setRentals([...openRentals, ...recentReturns]);
                        setLoading(false);
    }, []);

    const getFilteredRentals = (list: Rental[], statusFilter: (r: Rental) => boolean) => {
        return list.filter(rental =>
            (rental?.rider?.fullName.toLowerCase().includes(search.toLowerCase()) ||
                rental?.vehicle?.code.toLowerCase().includes(search.toLowerCase())) &&
            statusFilter(rental)
        );
    }

    const dueTodayRentals = getFilteredRentals(rentals, r => r.status === 'ongoing' && isToday(new Date(r.expectedReturnDate)));
    const overdueRentals = getFilteredRentals(rentals, r => r.status === 'overdue');
    const recentRentals = getFilteredRentals(rentals, r => r.status === 'completed');


    const renderTable = (data: Rental[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Rental ID</TableHead>
                    <TableHead>Rider</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                        </TableRow>
                    ))
                ) : data.length > 0 ? data.map((rental) => (
                    <TableRow key={rental.id}>
                        <TableCell className="font-medium">
                            <Link href={`/admin/rentals/${rental.id}`} className="text-primary hover:underline">
                                #{rental.id.substring(0, 7)}...
                            </Link>
                        </TableCell>
                        <TableCell>{rental?.rider?.fullName}</TableCell>
                        <TableCell>{rental?.vehicle?.code}</TableCell>
                        <TableCell>{formatIST(rental.expectedReturnDate, 'dd MMM yy')}</TableCell>
                        <TableCell>
                            <Badge
                                variant={rental.status === 'completed' ? 'default' : rental.status === 'ongoing' ? 'secondary' : 'destructive'}
                                className={cn(rental.status === 'ongoing' && 'bg-blue-500 text-white')}
                            >
                                {rental.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right font-code">{formatINR(rental.balanceDue)}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/returns/${rental.id}`}>
                                    {rental.status === 'completed' ? 'View' : 'Process'}
                                </Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow><TableCell colSpan={7} className="text-center">No rentals found.</TableCell></TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <>
            <PageHeader title="Return Center" description="Process vehicle returns and manage settlements.">
                <Button variant="outline"><FileDown className="mr-2 h-4 w-4" /> Export CSV</Button>
            </PageHeader>
            <Card>
                <CardContent>
                    <Tabs defaultValue="overdue">
                        <div className="flex justify-between items-center py-4">
                            <TabsList>
                                <TabsTrigger value="dueToday">Due Today ({dueTodayRentals.length})</TabsTrigger>
                                <TabsTrigger value="overdue">Overdue ({overdueRentals.length})</TabsTrigger>
                                <TabsTrigger value="recent">Recently Returned ({recentRentals.length})</TabsTrigger>
                            </TabsList>
                            <div className="w-1/3">
                                <Input
                                    placeholder="Search by rider or vehicle..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <TabsContent value="dueToday">{renderTable(dueTodayRentals)}</TabsContent>
                        <TabsContent value="overdue">{renderTable(overdueRentals)}</TabsContent>
                        <TabsContent value="recent">{renderTable(recentRentals)}</TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    );
}
