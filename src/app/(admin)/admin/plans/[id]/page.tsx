'use client';

import { useState } from 'react';
import {useParams, useRouter} from 'next/navigation';
import Link from 'next/link';
import { Pencil, Eye, Trash2, ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlanForm } from '@/components/admin/forms/plan-form';
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

import { usePlan } from '@/hooks/api/use-plans';

export default function PlanDetailPage() {
    // const params = useParams();
    const router = useRouter();
    const params = useParams<{ id: string }>();          // ✅ useParams in Client Components
    const id = params?.id as string;                     // route param (string)
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
                        <Link href="/admin/plans"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={plan.planName}
                description={`Plan #${plan.planId} — manage details, documents, and features.`}
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/plans"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
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
                                    This action cannot be undone. Existing rentals won’t be affected, but the plan will be removed from creation flows.
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

            {!editing ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Plan Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <div className="text-sm text-muted-foreground">Plan Name</div>
                                <div className="mt-1 font-medium">{plan.planName}</div>
                            </div>

                            <div>
                                <div className="text-sm text-muted-foreground">Required Documents</div>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {(plan.requiredDocuments ?? []).length ? (
                                        plan.requiredDocuments!.map((d) => (
                                            <Badge key={d} variant="secondary">{d}</Badge>
                                        ))
                                    ) : (
                                        <Badge variant="outline">None</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-muted-foreground">Features</div>
                            <div className="mt-2">
                                {Array.isArray(plan.features) ? (
                                    <ul className="list-disc pl-5 space-y-1">
                                        {plan.features.map((f: any, i: number) => (
                                            <li key={i} className="text-sm">{String(f)}</li>
                                        ))}
                                    </ul>
                                ) : typeof plan.features === 'object' && plan.features ? (
                                    <pre className="rounded-md border bg-muted/40 p-3 text-xs overflow-auto">
{JSON.stringify(plan.features, null, 2)}
                  </pre>
                                ) : plan.features ? (
                                    <div className="text-sm">{String(plan.features)}</div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">—</div>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <div className="text-sm text-muted-foreground">Created</div>
                                <div className="mt-1 text-sm">{new Date(plan.createdAt).toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Last Updated</div>
                                <div className="mt-1 text-sm">{new Date(plan.updatedAt).toLocaleString()}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Plan</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <PlanForm
                            plan={{
                                planId: plan.planId,
                                planName: plan.planName,
                                requiredDocuments: plan.requiredDocuments ?? [],
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
