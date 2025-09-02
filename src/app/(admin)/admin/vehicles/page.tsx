'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatIST, formatINR } from '@/lib/format';
import type { Vehicle } from '@/lib/types';

// Hook (to be implemented like use-plans)
// expected shape: { vehicles: Vehicle[]|undefined, isLoading: boolean, isError: boolean, refresh: ()=>void }
import { useVehicles } from '@/hooks/api/use-vehicles';

export default function VehiclesPage() {
    const { vehicles, isLoading, isError } = useVehicles();
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return vehicles ?? [];
        return (vehicles ?? []).filter((v) => {
            const inCode = v.uniqueCode.toLowerCase().includes(q);
            const inModel = v.model.toLowerCase().includes(q);
            const inVin = v.vinNumber.toLowerCase().includes(q);
            const inPlan = (v.plan?.planName ?? '').toLowerCase().includes(q);
            const inTags = (v.tags ?? []).some((t) => t.toLowerCase().includes(q));
            return inCode || inModel || inVin || inPlan || inTags;
        });
    }, [vehicles, query]);

    return (
        <>
            <PageHeader title="Vehicles" description="Manage your fleet of vehicles.">
                <Button asChild>
                    <Link href="/admin/vehicles/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Vehicle
                    </Link>
                </Button>
            </PageHeader>

            <Card>
                <CardContent>
                    <div className="py-4">
                        <Input
                            placeholder="Search by code, model, VIN, plan, or tag…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="max-w-md"
                        />
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[160px]">Code</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead className="hidden md:table-cell">VIN</TableHead>
                                <TableHead className="hidden lg:table-cell">Plan</TableHead>
                                <TableHead className="hidden md:table-cell">Last Service</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden lg:table-cell text-right">Rent / Day</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {/* Loading skeleton rows */}
                            {isLoading && (!vehicles || vehicles.length === 0) && (
                                <>
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <TableRow key={`skeleton-${i}`}>
                                            <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                                            <TableCell><div className="h-4 w-40 animate-pulse rounded bg-muted" /></TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell text-right">
                                                <div className="h-4 ml-auto w-20 animate-pulse rounded bg-muted" />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="h-8 w-24 ml-auto animate-pulse rounded bg-muted" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            )}

                            {/* Error state */}
                            {isError && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-10 text-center text-destructive">
                                        Failed to load vehicles.
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* Empty state */}
                            {!isLoading && !isError && filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                                        No vehicles found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* Data rows */}
                            {filtered.map((v) => (
                                <TableRow key={v.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{v.uniqueCode}</span>
                                            <span className="text-xs text-muted-foreground">#{v.id}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell>{v.model}</TableCell>

                                    <TableCell className="hidden md:table-cell">
                                        <span className="font-mono text-xs">{v.vinNumber}</span>
                                    </TableCell>

                                    <TableCell className="hidden lg:table-cell">
                                        {v.plan?.planName ? (
                                            <Badge variant="secondary">{v.plan.planName}</Badge>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>

                                    <TableCell className="hidden md:table-cell">
                                        {v.lastServiceDate
                                            ? formatIST(v.lastServiceDate, 'dd MMM yyyy')
                                            : <span className="text-muted-foreground">—</span>}
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant={v.status === 'Available' ? 'default' : 'secondary'}>
                                                {v.status}
                                            </Badge>
                                            {v.isServiceDue && (
                                                <Badge variant="destructive">Service Due</Badge>
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell className="hidden lg:table-cell text-right">
                                        {formatINR(v.rentPerDay)}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/admin/vehicles/${v.id}`}>View Details</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
