'use client';

import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { PlanSchema } from "@/lib/schema";
import { useToast } from '@/hooks/use-toast';
import { usePlans, usePlan } from '@/hooks/api/use-plans';

type PlanFormValues = z.infer<typeof PlanSchema>;

type PlanFormProps = {
    plan?: {
        planId: number;
        planName: string;
        features?: any;
        requiredDocuments?: string[];
    };
    onSuccess?: () => void;
};

const DOC_OPTIONS = ['Aadhaar', 'PAN', 'DrivingLicense'] as const;

export function PlanForm({ plan, onSuccess }: PlanFormProps) {
    const router = useRouter();
    const { toast } = useToast();

    // Hooks for API
    const { create } = usePlans();
    const { update } = usePlan(plan?.planId);

    const isEditMode = !!plan;

    const defaultValues: Partial<PlanFormValues> = plan
        ? {
            planName: plan.planName,
            requiredDocuments: plan.requiredDocuments ?? [],
            featuresText:
                typeof plan.features === 'string'
                    ? plan.features
                    : plan.features
                        ? JSON.stringify(plan.features, null, 2)
                        : '',
        }
        : {
            planName: '',
            requiredDocuments: [],
            featuresText: '',
        };

    const form = useForm<PlanFormValues>({
        resolver: zodResolver(PlanSchema),
        defaultValues,
    });

    async function onSubmit(data: PlanFormValues) {
        let features: any = undefined;
        const raw = (data.featuresText || '').trim();
        if (raw.length > 0) {
            try {
                features = JSON.parse(raw);
            } catch {
                features = raw.split(',').map((s) => s.trim()).filter(Boolean);
            }
        }

        const payload = {
            planName: data.planName,
            requiredDocuments: data.requiredDocuments,
            features,
        };

        try {
            if (isEditMode && plan?.planId) {
                await update(payload);
                toast({ title: 'Plan Updated', description: `${data.planName} updated successfully.` });
            } else {
                await create(payload);
                toast({ title: 'Plan Created', description: `${data.planName} created successfully.` });
            }

            if (onSuccess) return onSuccess();
            if (isEditMode) return router.refresh();
            router.push('/admin/plans');
        } catch (err: any) {
            toast({ title: 'Error', description: err.message ?? 'Something went wrong', variant: 'destructive' });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Plan Name */}
                    <FormField
                        control={form.control}
                        name="planName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Plan Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Lite / Pro" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Required Documents */}
                    <FormField
                        control={form.control}
                        name="requiredDocuments"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Required Documents</FormLabel>
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    {DOC_OPTIONS.map((opt) => {
                                        const checked = field.value?.includes(opt) ?? false;
                                        return (
                                            <label key={opt} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer">
                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={(v) => {
                                                        const next = new Set(field.value || []);
                                                        if (v) next.add(opt);
                                                        else next.delete(opt);
                                                        field.onChange(Array.from(next));
                                                    }}
                                                />
                                                <span className="text-sm">{opt}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Features */}
                    <FormField
                        control={form.control}
                        name="featuresText"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Features</FormLabel>
                                <FormControl>
                                    <Textarea
                                        rows={6}
                                        placeholder={`Either paste valid JSON (e.g. ["24x7 support","Theft cover"]) or comma-separated values like:
Fast support, Free helmet, Theft coverage`}
                                        {...field}
                                    />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">Saved as JSON in the database.</p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit">{isEditMode ? 'Save Changes' : 'Create Plan'}</Button>
                </div>
            </form>
        </Form>
    );
}
