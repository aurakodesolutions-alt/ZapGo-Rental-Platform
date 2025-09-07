'use client';

import * as React from 'react';
import Link from 'next/link';
import { useDebouncedCallback } from 'use-debounce';
import { FileDown, PlusCircle } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatINR, formatIST } from '@/lib/format';

type RentalStatus = 'ongoing' | 'completed' | 'overdue' | 'cancelled' | string;

type RentalRow = {
    rentalId: number;
    riderId: number;
    vehicleId: number;
    planId: number;

    startDate: string | null;
    expectedReturnDate: string | null;
    actualReturnDate?: string | null;

    status: RentalStatus;
    payableTotal: number;
    paidTotal: number;
    balanceDue: number;

    rider?: { name: string | null; phone: string | null };
    vehicle?: { code: string | null; model: string | null };
    plan?: { name: string | null };
};

type ApiResponse = {
    ok: boolean;
    data: RentalRow[];
    page?: { limit: number; offset: number; total: number };
    error?: string;
};

export default function RentalsPage() {
    const [rows, setRows] = React.useState<RentalRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);

    const fetchData = React.useCallback(async (q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const url = new URL('/api/v1/admin/rentals', window.location.origin);
            if (q && q.trim()) url.searchParams.set('q', q.trim());
            url.searchParams.set('order', 'created_desc');
            url.searchParams.set('limit', '100');
            url.searchParams.set('offset', '0');

            const res = await fetch(url.toString(), { cache: 'no-store' });
            const json: ApiResponse = await res.json();
            if (!res.ok || !json.ok) throw new Error(json?.error || 'Failed to fetch rentals');
            setRows(json.data || []);
        } catch (e: any) {
            setError(String(e?.message || e));
        } finally {
            setLoading(false);
        }
    }, []);

    // initial load
    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    // debounced server-side search
    const debounced = useDebouncedCallback((val: string) => {
        fetchData(val);
    }, 350);

    const handleSearch = (val: string) => {
        setSearch(val);
        debounced(val);
    };

    const exportCsv = () => {
        const header = [
            'RentalId','Rider','Phone','Vehicle','Plan',
            'StartDate','ExpectedReturnDate','Status','PaidTotal','BalanceDue'
        ];
        const lines = rows.map(r => ([
            r.rentalId,
            r.rider?.name ?? '',
            r.rider?.phone ?? '',
            r.vehicle?.code ?? '',
            r.plan?.name ?? '',
            r.startDate ? new Date(r.startDate).toLocaleString() : '',
            r.expectedReturnDate ? new Date(r.expectedReturnDate).toLocaleString() : '',
            r.status ?? '',
            r.paidTotal ?? 0,
            r.balanceDue ?? 0,
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')));

        const csv = [header.join(','), ...lines].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rentals_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const statusBadge = (s: RentalStatus) => {
        const lower = (s || '').toString().toLowerCase();
        if (lower === 'completed') return <Badge variant="default">completed</Badge>;
        if (lower === 'overdue')   return <Badge variant="destructive">overdue</Badge>;
        if (lower === 'cancelled') return <Badge variant="outline">cancelled</Badge>;
        // ongoing or others
        return <Badge className={cn('bg-blue-500 text-white')}>ongoing</Badge>;
    };

    return (
        <>
            <PageHeader title="Rentals" description="Manage all rental agreements.">
                <Button variant="outline" onClick={exportCsv}>
                    <FileDown className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <Button asChild>
                    <Link href="/admin/rentals/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> New Rental
                    </Link>
                </Button>
            </PageHeader>

            <Card>
                <CardContent>
                    <div className="py-4">
                        <Input
                            placeholder="Search by rider name/phone or vehicle code/model…"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    {error ? (
                        <div className="p-4 text-sm text-destructive">{error}</div>
                    ) : (
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
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                                            Loading rentals…
                                        </TableCell>
                                    </TableRow>
                                ) : rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                                            No rentals found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((r) => (
                                        <TableRow key={r.rentalId}>
                                            <TableCell className="font-medium">
                                                <Link href={`/admin/rentals/${r.rentalId}`} className="text-primary hover:underline">
                                                    #{r.rentalId}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                {r.rider?.name ?? '—'}
                                                {r.rider?.phone ? <span className="text-muted-foreground block text-xs">{r.rider.phone}</span> : null}
                                            </TableCell>
                                            <TableCell>
                                                {r.vehicle?.code ?? '—'}
                                                {r.vehicle?.model ? <span className="text-muted-foreground block text-xs">{r.vehicle.model}</span> : null}
                                            </TableCell>
                                            <TableCell>{r.plan?.name ?? `#${r.planId}`}</TableCell>
                                            <TableCell>{r.startDate ? formatIST(r.startDate, 'dd MMM yy, HH:mm') : '—'}</TableCell>
                                            <TableCell>{r.expectedReturnDate ? formatIST(r.expectedReturnDate, 'dd MMM yy, HH:mm') : '—'}</TableCell>
                                            <TableCell>{statusBadge(r.status)}</TableCell>
                                            <TableCell className="text-right font-code">
                                                {formatINR(r.balanceDue ?? 0)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
