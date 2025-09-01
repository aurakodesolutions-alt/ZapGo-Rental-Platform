
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/admin/page-header';
import { mockRentals } from '@/lib/mock-data';
import { formatINR, formatIST } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { FileDown, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function RentalsPage() {
    const [rentals, setRentals] = React.useState(mockRentals);
    const [search, setSearch] = React.useState('');

    const filteredRentals = rentals.filter(rental =>
        rental?.rider?.fullName.toLowerCase().includes(search.toLowerCase()) ||
        rental?.vehicle?.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <PageHeader title="Rentals" description="Manage all rental agreements.">
                <Button variant="outline"><FileDown className="mr-2 h-4 w-4" /> Export CSV</Button>
                <Button asChild><Link href="/admin/rentals/new"><PlusCircle className="mr-2 h-4 w-4" /> New Rental</Link></Button>
            </PageHeader>
            <Card>
                <CardContent>
                    <div className="py-4">
                        <Input
                            placeholder="Search by rider or vehicle..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rental ID</TableHead>
                                <TableHead>Rider</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>Return Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Balance Due</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRentals.map((rental) => (
                                <TableRow key={rental.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/rentals/${rental.id}`} className="text-primary hover:underline">
                                            #{rental.id.substring(0, 7)}...
                                        </Link>
                                    </TableCell>
                                    <TableCell>{rental?.rider?.fullName}</TableCell>
                                    <TableCell>{rental?.vehicle?.code}</TableCell>
                                    <TableCell>{rental.plan}</TableCell>
                                    <TableCell>{formatIST(rental.startDate, 'dd MMM yy')}</TableCell>
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
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
