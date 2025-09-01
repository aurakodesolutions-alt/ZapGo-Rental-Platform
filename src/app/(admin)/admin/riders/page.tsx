'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { useRiders } from '@/hooks/api/use-riders'; // your riders hook
// If you already have formatIST, use it. Otherwise fall back to toLocaleDateString.
import { formatIST } from '@/lib/format';

function formatDate(iso?: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    try {
        return formatIST(iso, 'dd MMM yyyy');
    } catch {
        return d.toLocaleDateString();
    }
}

export default function RidersPage() {
    const [query, setQuery] = useState('');
    const { riders, isLoading, isError } = useRiders({ q: query });

    const rows = useMemo(() => riders ?? [], [riders]);

    return (
        <>
            <PageHeader title="Riders" description="Manage all rider profiles.">
                <Button asChild>
                    <Link href="/admin/riders/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Rider
                    </Link>
                </Button>
            </PageHeader>

            <Card>
                <CardContent>
                    <div className="py-4">
                        <Input
                            placeholder="Search by name, phone, or email…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    {isLoading ? (
                        <div className="p-6 text-sm text-muted-foreground">Loading riders…</div>
                    ) : isError ? (
                        <div className="p-6 text-sm text-destructive">Failed to load riders.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>KYC</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No riders found. Try a different search or{' '}
                                            <Link href="/admin/riders/new" className="text-primary underline underline-offset-4">
                                                add a new rider
                                            </Link>
                                            .
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((rider) => {
                                        const kyc = rider.kyc;
                                        const kycComplete = !!(
                                            kyc &&
                                            kyc.aadhaarNumber &&
                                            kyc.panNumber &&
                                            (kyc.proPlan ? kyc.drivingLicenseNumber : true)
                                        );

                                        return (
                                            <TableRow key={rider.riderId}>
                                                <TableCell className="font-medium">{rider.fullName}</TableCell>
                                                <TableCell>{rider.phone}</TableCell>
                                                <TableCell className="truncate max-w-[220px]">{rider.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={kycComplete ? 'secondary' : 'outline'}>
                                                        {kycComplete ? 'Complete' : 'Pending'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatDate(rider.createdAtUtc)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/admin/riders/${rider.riderId}`}>View Details</Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
