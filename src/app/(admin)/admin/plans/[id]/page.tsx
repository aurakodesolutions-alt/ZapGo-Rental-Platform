'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Pencil,
    Eye,
    Trash2,
    FileCheck2,
    Banknote,
    Shield,
    Hash,
    ListChecks,
    CalendarClock,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

import { PlanForm } from '@/components/admin/forms/plan-form';
import { usePlan } from '@/hooks/api/use-plans';

/* ----------------------------- Helpers ----------------------------- */

function formatINR(n?: number | null) {
    if (typeof n !== 'number') return '—';
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === 'object' && !Array.isArray(v);
}

function SafeDate({ value }: { value?: string | number | Date | null }) {
    if (!value) return <>—</>;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return <>—</>;
    return <>{d.toLocaleString()}</>;
}

/* Reusable mini components (no hooks) */

function StatCard({
                      icon: Icon,
                      label,
                      value,
                  }: {
    icon: any;
    label: string;
    value: string | number;
}) {
    return (
        <Card className="rounded-2xl">
            <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-xl p-3 ring-1 bg-muted/40 text-muted-foreground">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="text-base font-semibold">{value}</div>
                </div>
            </CardContent>
        </Card>
    );
}

function KVRow({ k, v }: { k: string; v: string | number | null | undefined }) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">{k}</div>
            <div className="text-sm font-medium">{v ?? '—'}</div>
        </div>
    );
}

/* ----------------------------- Page ----------------------------- */

export default function PlanDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = Number(params?.id);
    const [editing, setEditing] = useState(false);

    const { plan, isLoading, isError, remove } = usePlan(id);

    const onEdited = () => {
        setEditing(false);
        router.refresh?.();
    };

    if (isLoading) {
        return <div className="p-6 text-sm text-muted-foreground">Loading plan…</div>;
    }

    if (isError || !plan) {
        return (
            <div className="p-6 text-sm text-destructive">
                Failed to load plan.
                <div className="mt-3">
                    <Button variant="outline" asChild>
                        <Link href="/admin/plans">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const docs = Array.isArray(plan.requiredDocuments) ? plan.requiredDocuments.filter(Boolean) : [];
    const features = plan.features;

    return (
        <div className="space-y-6">
            <PageHeader
                title={plan.planName}
                description={`Plan #${plan.planId} — manage details, documents, and features.`}
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/plans">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Link>
                    </Button>

                    {!editing ? (
                        <Button onClick={() => setEditing(true)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    ) : (
                        <Button variant="secondary" onClick={() => setEditing(false)}>
                            <Eye className="mr-2 h-4 w-4" /> View
                        </Button>
                    )}

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete plan “{plan.planName}”?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. Existing rentals won’t be affected, but this plan will be removed from creation flows.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={async () => {
                                        await remove();
                                        router.push('/admin/plans');
                                    }}
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </PageHeader>

            {/* Stat strip */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard icon={Banknote} label="Joining Fee" value={formatINR(plan.joiningFees)} />
                <StatCard icon={Shield} label="Security Deposit" value={formatINR(plan.securityDeposit)} />
                <StatCard icon={FileCheck2} label="Required Docs" value={docs.length} />
                <StatCard icon={Hash} label="Plan ID" value={plan.planId} />
            </div>

            {!editing ? (
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left: Overview + Documents */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Overview */}
                        <Card className="rounded-2xl">
                            <CardHeader>
                                <CardTitle>Overview</CardTitle>
                                <CardDescription>Quick reference information for this plan.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <KVRow k="Plan Name" v={plan.planName} />
                                <KVRow k="Plan ID" v={plan.planId} />
                                <KVRow k="Joining Fees" v={formatINR(plan.joiningFees)} />
                                <KVRow k="Security Deposit" v={formatINR(plan.securityDeposit)} />
                            </CardContent>
                        </Card>

                        {/* Required Documents */}
                        <Card className="rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                                    Required Documents
                                </CardTitle>
                                <CardDescription>Documents that must be captured from the rider.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {docs.length ? (
                                    <div className="flex flex-wrap gap-2">
                                        {docs.map((d) => (
                                            <Badge key={d} variant="secondary">
                                                {d}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No required documents.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Features + Timestamps */}
                    <div className="space-y-6">
                        {/* Features */}
                        <Card className="rounded-2xl">
                            <CardHeader>
                                <CardTitle>Features</CardTitle>
                                <CardDescription>Included benefits & plan attributes.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {Array.isArray(features) && features.length > 0 ? (
                                    <ul className="list-disc pl-5 space-y-1">
                                        {features.map((f: any, i: number) => (
                                            <li key={i} className="text-sm">
                                                {String(f)}
                                            </li>
                                        ))}
                                    </ul>
                                ) : isPlainObject(features) ? (
                                    <div className="grid gap-2">
                                        {Object.entries(features as Record<string, unknown>).map(([k, v]) => (
                                            <div key={k} className="flex items-start justify-between gap-4 rounded-md border p-2">
                                                <span className="text-xs text-muted-foreground">{k}</span>
                                                <span className="text-sm font-medium">
                          {typeof v === 'string' || typeof v === 'number' ? String(v) : JSON.stringify(v)}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : features ? (
                                    <div className="text-sm">{String(features)}</div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No features specified.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Timestamps */}
                        <Card className="rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3">
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="text-xs text-muted-foreground">Created</div>
                                    <div className="text-sm font-medium">
                                        <SafeDate value={plan.createdAt} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="text-xs text-muted-foreground">Last Updated</div>
                                    <div className="text-sm font-medium">
                                        <SafeDate value={plan.updatedAt} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <Card className="rounded-2xl">
                    <CardHeader>
                        <CardTitle>Edit Plan</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <PlanForm
                            plan={{
                                planId: plan.planId,
                                planName: plan.planName,
                                requiredDocuments: plan.requiredDocuments ?? [],
                                joiningFees: plan.joiningFees ?? 0,
                                securityDeposit: plan.securityDeposit ?? 0,
                                features: plan.features,
                            }}
                            onSuccess={onEdited}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
