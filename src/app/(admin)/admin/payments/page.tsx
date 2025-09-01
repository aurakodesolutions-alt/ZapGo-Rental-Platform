
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
import * as mockApi from '@/lib/mock-data';
import type { Payment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        setLoading(true);

        setPayments(mockApi.mockPayments);
        setLoading(false);
    }, [search]);

    return (
        <>
            <PageHeader title="Payments" description="View and manage all payments.">
                <Button variant="outline"><FileDown className="mr-2 h-4 w-4" /> Export CSV</Button>
                <Button asChild><Link href="/admin/payments/new"><PlusCircle className="mr-2 h-4 w-4" /> New Payment</Link></Button>
            </PageHeader>
            <Card>
                <CardContent>
                    <div className="py-4">
                        <Input
                            placeholder="Search by rider or rental ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Payment ID</TableHead>
                                <TableHead>Rider</TableHead>
                                <TableHead>Rental ID</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                ))
                            ) : payments.length > 0 ? payments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/admin/payments/${payment.id}`} className="hover:underline text-primary">
                                            #{payment.id.substring(0, 7)}...
                                        </Link>
                                    </TableCell>
                                    <TableCell>{payment?.rider?.fullName}</TableCell>
                                    <TableCell>
                                        <Link href={`/admin/rentals/${payment.rentalId}`} className="hover:underline">
                                            #{payment.rentalId.substring(0, 7)}...
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{payment.method.toUpperCase()}</Badge>
                                    </TableCell>
                                    <TableCell>{formatIST(payment.transactionDate, 'dd MMM yyyy')}</TableCell>
                                    <TableCell className="text-right font-code">{formatINR(payment.amount)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={6} className="text-center">No payments found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
