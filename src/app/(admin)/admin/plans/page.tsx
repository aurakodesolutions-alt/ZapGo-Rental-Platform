'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Trash2, Pencil, Eye } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { usePlans } from '@/hooks/api/use-plans';

function formatDate(iso?: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
}

export default function PlansPage() {
    // local search box (debounced -> query sent to API)
    const [query, setQuery] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(query.trim()), 300);
        return () => clearTimeout(t);
    }, [query]);

    const { plans, isLoading, isError, remove } = usePlans({ q: debouncedQ });

    // Server already filters by q; keep this hook if you want extra client-side transforms
    const rows = useMemo(() => plans, [plans]);

    return (
        <>
            <PageHeader title="Plans" description="Manage rental plans and document requirements.">
                <Button asChild>
                    <Link href="/admin/plans/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Plan
                    </Link>
                </Button>
            </PageHeader>

            <Card>
                <CardContent>
                    <div className="py-4 flex items-center gap-3">
                        <Input
                            placeholder="Search by name, feature, or document…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="max-w-md"
                        />
                    </div>

                    {isLoading ? (
                        <div className="p-6 text-sm text-muted-foreground">Loading plans…</div>
                    ) : isError ? (
                        <div className="p-6 text-sm text-destructive">Failed to load plans.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[220px]">Plan</TableHead>
                                    <TableHead>Required Documents</TableHead>
                                    <TableHead className="hidden md:table-cell">Features</TableHead>
                                    <TableHead className="hidden lg:table-cell">Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {rows.map((plan) => {
                                    const docs = plan.requiredDocuments || [];
                                    const featsCount = Array.isArray(plan.features)
                                        ? plan.features.length
                                        : typeof plan.features === 'object' && plan.features !== null
                                            ? Object.keys(plan.features).length
                                            : String(plan.features || '').length > 0
                                                ? 1
                                                : 0;

                                    return (
                                        <TableRow key={plan.planId}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{plan.planName}</span>
                                                    <span className="text-xs text-muted-foreground">ID #{plan.planId}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {docs.length === 0 ? (
                                                        <Badge variant="outline">None</Badge>
                                                    ) : (
                                                        docs.map((d) => (
                                                            <Badge key={d} variant="secondary">
                                                                {d}
                                                            </Badge>
                                                        ))
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell className="hidden md:table-cell">
                                                {featsCount > 0 ? (
                                                    <Badge variant="outline">
                                                        {featsCount} feature{featsCount > 1 ? 's' : ''}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>

                                            <TableCell className="hidden lg:table-cell">
                                                <span className="text-muted-foreground">{formatDate(plan.updatedAt)}</span>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/admin/plans/${plan.planId}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                    <Button size="sm" variant="secondary" asChild>
                                                        <Link href={`/admin/plans/${plan.planId}`}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </Link>
                                                    </Button>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="sm" variant="destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Delete plan “{plan.planName}”?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. Rentals already created with this
                                                                    plan will not be affected, but the plan will be removed from the
                                                                    creation flow.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-destructive hover:bg-destructive/90"
                                                                    onClick={() => remove(plan.planId)}
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {rows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            No plans found. Try a different search or&nbsp;
                                            <Link href="/admin/plans/new" className="text-primary underline underline-offset-4">
                                                create a new plan
                                            </Link>
                                            .
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
